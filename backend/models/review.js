const db = require('../config/db');

const Review = {
  async create({ task_id, reviewer_id, reviewee_id, rating, comment }) {
    const [result] = await db.execute(
      'INSERT INTO reviews (task_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [task_id, reviewer_id, reviewee_id, rating, comment || null]
    );
    return result;
  },

  async findByUser(userId) {
    const [rows] = await db.execute(
      `SELECT r.*, u.username AS reviewer_name
       FROM reviews r LEFT JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async hasReviewed(taskId, reviewerId) {
    const [rows] = await db.execute(
      'SELECT id FROM reviews WHERE task_id = ? AND reviewer_id = ?',
      [taskId, reviewerId]
    );
    return rows.length > 0;
  },
};

module.exports = Review;
