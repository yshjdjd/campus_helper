const db = require('../config/db');

const Task = {
  async create({ publisher_id, title, description, category_id, reward = 0, deadline, location }) {
    // 将 ISO 8601 格式转为 MySQL datetime 格式
    const formattedDeadline = deadline ? new Date(deadline).toISOString().slice(0, 19).replace('T', ' ') : null;
    const [result] = await db.execute(
      `INSERT INTO tasks (publisher_id, title, description, category_id, reward, deadline, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [publisher_id, title, description, category_id, reward, formattedDeadline, location || null]
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

  async findAll({ category_id, status, keyword, page = 1, limit = 10 } = {}) {
    let sql = `SELECT t.*, u.username AS publisher_name, u.avatar AS publisher_avatar, c.name AS category_name
               FROM tasks t
               LEFT JOIN users u ON t.publisher_id = u.id
               LEFT JOIN categories c ON t.category_id = c.id
               WHERE 1=1`;
    const params = [];

    if (category_id) { sql += ' AND t.category_id = ?'; params.push(category_id); }

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    } else if (!keyword) {
      sql += " AND t.status NOT IN ('completed', 'cancelled')";
    }

    if (keyword) {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const countSql = sql.replace(/SELECT .+ FROM/s, 'SELECT COUNT(*) AS total FROM');
    const [countRows] = await db.execute(countSql, params);
    const total = countRows[0].total;

    const offset = (page - 1) * limit;
    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
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
    const [countRows] = await db.execute('SELECT COUNT(*) AS total FROM tasks WHERE acceptor_id = ?', [acceptorId]);
    const total = countRows[0].total;
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT t.*, u.username AS publisher_name, c.name AS category_name
       FROM tasks t
       LEFT JOIN users u ON t.publisher_id = u.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.acceptor_id = ?
       ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
      [acceptorId, String(limit), String(offset)]
    );
    return { rows, total, page, limit };
  },

  /**
   * 确认完成：记录某方的确认，若双方都确认则自动改状态为 completed
   * @returns {{ confirmed: boolean, bothConfirmed: boolean }}
   */
  async confirmCompletion(taskId, userId) {
    const task = await this.findById(taskId);
    if (!task) throw new Error('任务不存在');
    if (task.status !== 'in_progress') throw new Error('任务当前状态不可确认完成');

    let field = null;
    if (task.publisher_id === userId) field = 'publisher_confirmed';
    else if (task.acceptor_id === userId) field = 'acceptor_confirmed';
    else throw new Error('无权确认此任务');

    // 已经确认过则跳过
    if (task[field]) return { confirmed: true, bothConfirmed: task.publisher_confirmed && task.acceptor_confirmed };

    await db.execute(`UPDATE tasks SET ${field} = 1 WHERE id = ?`, [taskId]);

    // 检查双方是否都已确认
    const updated = await this.findById(taskId);
    const bothConfirmed = updated.publisher_confirmed && updated.acceptor_confirmed;
    if (bothConfirmed) {
      await db.execute("UPDATE tasks SET status = 'completed' WHERE id = ?", [taskId]);
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
       WHERE t.status = 'completed' AND (t.publisher_id = ? OR t.acceptor_id = ?)
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
    const [result] = await db.execute(
      "UPDATE tasks SET acceptor_id = NULL, status = 'recruiting', publisher_confirmed = 0, acceptor_confirmed = 0 WHERE id = ?",
      [id]
    );
    return result;
  },
};

module.exports = Task;
