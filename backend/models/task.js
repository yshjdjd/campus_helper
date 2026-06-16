const db = require('../config/db');

const Task = {
  async create({ publisher_id, title, description, category, reward = 0, deadline, location }) {
    const [result] = await db.execute(
      `INSERT INTO tasks (publisher_id, title, description, category, reward, deadline, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [publisher_id, title, description, category, reward, deadline || null, location || null]
    );
    return result;
  },

  async findById(id) {
    const [rows] = await db.execute(
      `SELECT t.*,
              u1.username AS publisher_name, u1.avatar AS publisher_avatar, u1.credit_score AS publisher_credit,
              u2.username AS acceptor_name, u2.avatar AS acceptor_avatar
       FROM tasks t
       LEFT JOIN users u1 ON t.publisher_id = u1.id
       LEFT JOIN users u2 ON t.acceptor_id = u2.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findAll({ category, status, keyword, page = 1, limit = 10 } = {}) {
    let sql = `SELECT t.*, u.username AS publisher_name, u.avatar AS publisher_avatar
               FROM tasks t LEFT JOIN users u ON t.publisher_id = u.id WHERE 1=1`;
    const params = [];

    if (category) { sql += ' AND t.category = ?'; params.push(category); }
    if (status) { sql += ' AND t.status = ?'; params.push(status); }
    if (keyword) {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const countSql = sql.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) AS total FROM');
    const [countRows] = await db.execute(countSql, params);
    const total = countRows[0].total;

    const offset = (page - 1) * limit;
    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(String(limit), String(offset));

    const [rows] = await db.execute(sql, params);
    return { rows, total, page, limit };
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
};

module.exports = Task;
