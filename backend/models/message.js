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

  async findConversations(userId) {
    const [rows] = await db.execute(
      `SELECT m.task_id, t.title AS task_title,
              m.sender_id, m.receiver_id, m.content AS last_message, m.created_at AS last_time,
              u1.username AS sender_name, u2.username AS receiver_name
       FROM messages m
       INNER JOIN (
         SELECT task_id, MAX(id) AS max_id
         FROM messages
         WHERE sender_id = ? OR receiver_id = ?
         GROUP BY task_id
       ) latest ON m.id = latest.max_id
       LEFT JOIN tasks t ON m.task_id = t.id
       LEFT JOIN users u1 ON m.sender_id = u1.id
       LEFT JOIN users u2 ON m.receiver_id = u2.id
       ORDER BY m.created_at DESC`,
      [userId, userId]
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

  async countUnread(userId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) AS count FROM messages WHERE receiver_id = ? AND is_read = 0',
      [userId]
    );
    return rows[0].count;
  },

  async countUnreadByConversation(userId) {
    const [rows] = await db.execute(
      `SELECT task_id, COUNT(*) AS unread_count
       FROM messages
       WHERE receiver_id = ? AND is_read = 0
       GROUP BY task_id`,
      [userId]
    );
    return rows;
  },
};

module.exports = Message;
