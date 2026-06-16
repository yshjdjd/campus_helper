const Review = require('../models/review');
const Task = require('../models/task');
const db = require('../config/db');

const reviewController = {
  async create(req, res) {
    const conn = await db.getConnection();
    try {
      const { task_id, reviewee_id, rating, comment } = req.body;
      const reviewer_id = req.user.id;

      const task = await Task.findById(task_id);
      if (!task) return res.status(404).json({ code: 404, message: '任务不存在' });
      if (task.status !== 'completed') return res.status(400).json({ code: 400, message: '只能评价已完成的任务' });
      if (task.publisher_id !== reviewer_id && task.acceptor_id !== reviewer_id) {
        return res.status(403).json({ code: 403, message: '只有任务参与者可以评价' });
      }

      const alreadyReviewed = await Review.hasReviewed(task_id, reviewer_id);
      if (alreadyReviewed) return res.status(409).json({ code: 409, message: '您已评价过此任务' });

      await conn.beginTransaction();

      await conn.execute(
        'INSERT INTO reviews (task_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [task_id, reviewer_id, reviewee_id, rating, comment || null]
      );

      if (rating === 'good') {
        await conn.execute('UPDATE users SET credit_score = LEAST(credit_score + 1, 100) WHERE id = ?', [reviewee_id]);
      } else if (rating === 'bad') {
        await conn.execute('UPDATE users SET credit_score = GREATEST(credit_score - 1, 0) WHERE id = ?', [reviewee_id]);
      }

      await conn.commit();
      return res.status(201).json({ code: 201, message: '评价成功' });
    } catch (err) {
      await conn.rollback();
      console.error('Create review error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    } finally {
      conn.release();
    }
  },

  async listByUser(req, res) {
    try {
      const reviews = await Review.findByUser(req.params.userId);
      return res.json({ code: 200, data: reviews });
    } catch (err) {
      console.error('List reviews error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async listByTask(req, res) {
    try {
      const reviews = await Review.findByTask(req.params.taskId);
      return res.json({ code: 200, data: reviews });
    } catch (err) {
      console.error('List task reviews error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },
};

module.exports = reviewController;
