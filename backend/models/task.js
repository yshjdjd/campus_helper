const db = require('../config/db');

const Task = {
  async create({ publisher_id, title, description, category_id, reward = 0, deadline, location, max_acceptors, pickup_location, delivery_location, subject, custom_data, status }) {
    const formattedDeadline = deadline ? new Date(deadline).toISOString().slice(0, 19).replace('T', ' ') : null;
    const [result] = await db.execute(
      `INSERT INTO tasks (publisher_id, title, description, category_id, reward, deadline, location, max_acceptors, pickup_location, delivery_location, subject, custom_data, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [publisher_id, title, description, category_id, reward, formattedDeadline, location || null, max_acceptors || null, pickup_location || null, delivery_location || null, subject || null, custom_data || null, status || 'recruiting']
    );
    return result;
  },

  async findById(id) {
    const [rows] = await db.execute(
      `SELECT t.*,
              u1.username AS publisher_name, u1.avatar AS publisher_avatar, u1.credit_score AS publisher_credit,
              u2.username AS acceptor_name, u2.avatar AS acceptor_avatar,
              c.name AS category_name
       FROM tasks t
       LEFT JOIN users u1 ON t.publisher_id = u1.id
       LEFT JOIN users u2 ON t.acceptor_id = u2.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findAll({ category_id, status, keyword, subject, pickup_location, delivery_location, search_fields, reward_min, reward_max, page = 1, limit = 10 } = {}) {
    let sql = `SELECT t.*, u.username AS publisher_name, u.avatar AS publisher_avatar, c.name AS category_name,
                      COALESCE(ac.cnt, 0) AS acceptor_count
               FROM tasks t
               LEFT JOIN users u ON t.publisher_id = u.id
               LEFT JOIN categories c ON t.category_id = c.id
               LEFT JOIN (SELECT task_id, COUNT(*) AS cnt FROM task_acceptors GROUP BY task_id) ac ON t.id = ac.task_id
               WHERE 1=1`;
    const params = [];
    let hasExtraFilter = !!(keyword || subject || pickup_location || delivery_location || search_fields || reward_min || reward_max);

    if (category_id) { sql += ' AND t.category_id = ?'; params.push(category_id); }

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    } else if (!hasExtraFilter) {
      sql += " AND t.status NOT IN ('completed', 'cancelled')";
    }

    if (keyword) {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 已知列搜索
    if (subject) { sql += ' AND t.subject LIKE ?'; params.push(`%${subject}%`); }
    if (pickup_location) { sql += ' AND t.pickup_location LIKE ?'; params.push(`%${pickup_location}%`); }
    if (delivery_location) { sql += ' AND t.delivery_location LIKE ?'; params.push(`%${delivery_location}%`); }

    // 金额区间筛选
    if (reward_min) { sql += ' AND t.reward >= ?'; params.push(parseFloat(reward_min)); }
    if (reward_max) { sql += ' AND t.reward <= ?'; params.push(parseFloat(reward_max)); }

    // 通用自定义字段搜索 (JSON_EXTRACT)
    if (search_fields) {
      let sf;
      try { sf = typeof search_fields === 'string' ? JSON.parse(search_fields) : search_fields; }
      catch { sf = null; }
      if (sf) {
        for (const [key, val] of Object.entries(sf)) {
          if (val && !['subject', 'pickup_location', 'delivery_location'].includes(key)) {
            sql += ` AND JSON_UNQUOTE(JSON_EXTRACT(t.custom_data, '$."${key}"')) LIKE ?`;
            params.push(`%${val}%`);
          }
        }
      }
    }

    const countSql = `SELECT COUNT(*) AS total FROM (${sql}) AS _cnt`;
    const [countRows] = await db.execute(countSql, params);
    const total = countRows[0].total;

    const offset = (page - 1) * limit;
    sql += ' ORDER BY t.is_featured DESC, t.created_at DESC LIMIT ? OFFSET ?';
    params.push(String(limit), String(offset));

    const [rows] = await db.execute(sql, params);
    return { rows, total, page, limit };
  },

  async findByPublisherId(publisherId, { page = 1, limit = 10 } = {}) {
    const [countRows] = await db.execute('SELECT COUNT(*) AS total FROM tasks WHERE publisher_id = ?', [publisherId]);
    const total = countRows[0].total;
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT t.*, c.name AS category_name
       FROM tasks t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.publisher_id = ?
       ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
      [publisherId, String(limit), String(offset)]
    );
    return { rows, total, page, limit };
  },

  async findByAcceptorId(acceptorId, { page = 1, limit = 10 } = {}) {
    const [countRows] = await db.execute(
      'SELECT COUNT(*) AS total FROM task_acceptors WHERE user_id = ?', [acceptorId]
    );
    const total = countRows[0].total;
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT t.*, u.username AS publisher_name, c.name AS category_name
       FROM task_acceptors ta
       INNER JOIN tasks t ON ta.task_id = t.id
       LEFT JOIN users u ON t.publisher_id = u.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE ta.user_id = ?
       ORDER BY ta.created_at DESC LIMIT ? OFFSET ?`,
      [acceptorId, String(limit), String(offset)]
    );
    return { rows, total, page, limit };
  },

  // ========== 多人接单相关 ==========

  async addAcceptor(taskId, userId) {
    const [result] = await db.execute(
      'INSERT INTO task_acceptors (task_id, user_id) VALUES (?, ?)',
      [taskId, userId]
    );
    return result;
  },

  async removeAcceptor(taskId, userId) {
    const [result] = await db.execute(
      'DELETE FROM task_acceptors WHERE task_id = ? AND user_id = ?',
      [taskId, userId]
    );
    return result;
  },

  async getAcceptors(taskId) {
    const [rows] = await db.execute(
      `SELECT ta.*, u.username, u.avatar, u.credit_score
       FROM task_acceptors ta
       LEFT JOIN users u ON ta.user_id = u.id
       WHERE ta.task_id = ?
       ORDER BY ta.created_at ASC`,
      [taskId]
    );
    return rows;
  },

  async getAcceptorCount(taskId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) AS count FROM task_acceptors WHERE task_id = ?',
      [taskId]
    );
    return rows[0].count;
  },

  async hasAccepted(taskId, userId) {
    const [rows] = await db.execute(
      'SELECT id FROM task_acceptors WHERE task_id = ? AND user_id = ?',
      [taskId, userId]
    );
    return rows.length > 0;
  },

  /**
   * 确认完成：发布者确认 publisher_confirmed=1，接单者确认该行 confirmed=1
   * 完成条件：publisher_confirmed=1 且 task_acceptors 中至少一人 confirmed=1
   */
  async confirmCompletion(taskId, userId) {
    const task = await this.findById(taskId);
    if (!task) throw new Error('任务不存在');
    if (task.status !== 'in_progress') throw new Error('任务当前状态不可确认完成');

    // 发布者确认
    if (task.publisher_id === userId) {
      if (!task.publisher_confirmed) {
        await db.execute('UPDATE tasks SET publisher_confirmed = 1 WHERE id = ?', [taskId]);
      }
    } else {
      // 接单者确认
      const accepted = await this.hasAccepted(taskId, userId);
      if (!accepted) throw new Error('无权确认此任务');

      const [existing] = await db.execute(
        'SELECT confirmed FROM task_acceptors WHERE task_id = ? AND user_id = ?',
        [taskId, userId]
      );
      if (!existing[0].confirmed) {
        await db.execute(
          'UPDATE task_acceptors SET confirmed = 1 WHERE task_id = ? AND user_id = ?',
          [taskId, userId]
        );
      }
    }

    // 检查是否满足完成条件
    const updated = await this.findById(taskId);
    const acceptors = await this.getAcceptors(taskId);
    const anyAcceptorConfirmed = acceptors.some(a => a.confirmed);

    const bothConfirmed = updated.publisher_confirmed && anyAcceptorConfirmed;
    if (bothConfirmed) {
      await db.execute("UPDATE tasks SET status = 'completed' WHERE id = ?", [taskId]);
      // 将 acceptor_id 设为第一个确认的接单者（兼容）
      const firstConfirmed = acceptors.find(a => a.confirmed);
      if (firstConfirmed) {
        await db.execute('UPDATE tasks SET acceptor_id = ? WHERE id = ?', [firstConfirmed.user_id, taskId]);
      }
    }

    return { confirmed: true, bothConfirmed };
  },

  async findCompletedByUser(userId) {
    const [rows] = await db.execute(
      `SELECT t.*, c.name AS category_name,
              u1.username AS publisher_name,
              u2.username AS acceptor_name
       FROM tasks t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN users u1 ON t.publisher_id = u1.id
       LEFT JOIN users u2 ON t.acceptor_id = u2.id
       WHERE t.status = 'completed' AND (t.publisher_id = ? OR t.id IN (SELECT task_id FROM task_acceptors WHERE user_id = ?))
       ORDER BY t.updated_at DESC`,
      [userId, userId]
    );
    return rows;
  },

  async updateStatus(id, status, acceptor_id) {
    if (acceptor_id !== undefined) {
      const [result] = await db.execute(
        'UPDATE tasks SET status = ?, acceptor_id = ? WHERE id = ?',
        [status, acceptor_id, id]
      );
      return result;
    }
    const [result] = await db.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
    return result;
  },

  async clearAcceptor(id) {
    // 清空所有接单者记录，状态回退为 recruiting
    await db.execute('DELETE FROM task_acceptors WHERE task_id = ?', [id]);
    const [result] = await db.execute(
      "UPDATE tasks SET acceptor_id = NULL, status = 'recruiting', publisher_confirmed = 0, acceptor_confirmed = 0 WHERE id = ?",
      [id]
    );
    return result;
  },
};

module.exports = Task;