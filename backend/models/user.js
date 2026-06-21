const db = require('../config/db');

const User = {
  async create({ student_id, username, password_hash, school_email, role = 'student' }) {
    const [result] = await db.execute(
      'INSERT INTO users (student_id, username, password_hash, school_email, role) VALUES (?, ?, ?, ?, ?)',
      [student_id, username, password_hash, school_email, role]
    );
    return result;
  },

  async findByStudentId(student_id) {
    const [rows] = await db.execute('SELECT * FROM users WHERE student_id = ?', [student_id]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, student_id, username, school_email, avatar, role, is_banned, credit_score, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findByEmail(school_email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE school_email = ?', [school_email]);
    return rows[0] || null;
  },

  async findAll({ page = 1, limit = 20 } = {}) {
    const [countRows] = await db.execute('SELECT COUNT(*) AS total FROM users');
    const total = countRows[0].total;
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      'SELECT id, student_id, username, school_email, role, is_banned, credit_score, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [String(limit), String(offset)]
    );
    return { rows, total, page, limit };
  },

  async updateCredit(id, delta) {
    const [result] = await db.execute(
      'UPDATE users SET credit_score = credit_score + ? WHERE id = ?',
      [delta, id]
    );
    return result;
  },

  async updateBan(id, isBanned) {
    const [result] = await db.execute(
      'UPDATE users SET is_banned = ? WHERE id = ?',
      [isBanned ? 1 : 0, id]
    );
    return result;
  },

  async update(id, { username, avatar }) {
    const fields = [];
    const params = [];
    if (username !== undefined) { fields.push('username = ?'); params.push(username); }
    if (avatar !== undefined) { fields.push('avatar = ?'); params.push(avatar); }
    if (fields.length === 0) return null;
    params.push(id);
    const [result] = await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    return result;
  },
};

module.exports = User;
