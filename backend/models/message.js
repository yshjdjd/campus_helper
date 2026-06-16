const db = require('../config/db');

const Message = {
  async create({ task_id, sender_id, receiver_id, content }) {
    const [result] = await db.execute(
      'INSERT INTO messages (task_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
      [task_id, sender_id, receiver_id, content]
    );
    return result;
  },

  async findByTask(taskId, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT m.*, u.username AS sender_name, u.avatar AS sender_avatar
       FROM messages m LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.task_id = ?
       ORDER BY m.created_at ASC
       LIMIT ? OFFSET ?`,
      [taskId, String(limit), String(offset)]
    );
    return rows;
  },

  async markRead(taskId, userId) {
    const [result] = await db.execute(
      'UPDATE messages SET is_read = 1 WHERE task_id = ? AND receiver_id = ? AND is_read = 0',
      [taskId, userId]
    );
    return result;
  },
};

module.exports = Message;
