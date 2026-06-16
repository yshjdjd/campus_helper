const db = require('../config/db');

const Category = {
  async findAll({ includeInactive = false } = {}) {
    const sql = includeInactive
      ? 'SELECT * FROM categories ORDER BY sort_order ASC, id ASC'
      : 'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC';
    const [rows] = await db.execute(sql);
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ name, sort_order = 0 }) {
    const [result] = await db.execute(
      'INSERT INTO categories (name, sort_order) VALUES (?, ?)',
      [name, sort_order]
    );
    return result;
  },

  async update(id, { name, sort_order, is_active }) {
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); params.push(sort_order); }
    if (is_active !== undefined) { fields.push('is_active = ?'); params.push(is_active); }
    if (fields.length === 0) return null;
    params.push(id);
    const [result] = await db.execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params);
    return result;
  },

  async delete(id) {
    const [result] = await db.execute('DELETE FROM categories WHERE id = ?', [id]);
    return result;
  },
};

module.exports = Category;
