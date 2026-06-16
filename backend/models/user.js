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
      'SELECT id, student_id, username, school_email, avatar, role, credit_score, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findByEmail(school_email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE school_email = ?', [school_email]);
    return rows[0] || null;
  },

  async updateCredit(id, delta) {
    const [result] = await db.execute(
      'UPDATE users SET credit_score = credit_score + ? WHERE id = ?',
      [delta, id]
    );
    return result;
  },
};

module.exports = User;
