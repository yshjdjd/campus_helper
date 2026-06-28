const db = require('../config/db');

const Comment = {
  async create({ task_id, user_id, content, parent_id = null }) {
    const [result] = await db.execute(
      'INSERT INTO comments (task_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [task_id, user_id, content, parent_id]
    );
    return result;
  },

  async findByTask(taskId) {
    const [rows] = await db.execute(
      `SELECT c.*, u.username, u.avatar
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [taskId]
    );
    return rows;
  },

  async findByParent(parentId) {
    const [rows] = await db.execute(
      `SELECT c.*, u.username, u.avatar
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.parent_id = ?
       ORDER BY c.created_at ASC`,
      [parentId]
    );
    return rows;
  },

  async delete(id, userId) {
    // 先删子回复
    await db.execute('DELETE FROM comments WHERE parent_id = ?', [id]);
    const [result] = await db.execute(
      'DELETE FROM comments WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result;
  },
};

module.exports = Comment;
