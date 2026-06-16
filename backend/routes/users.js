const express = require('express');
const User = require('../models/user');
const Review = require('../models/review');
const Task = require('../models/task');

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });

    const reviews = await Review.findByUser(user.id);
    const completedAsPublisher = await Task.findByPublisherId(user.id, { limit: 100 });
    const completedAsAcceptor = await Task.findByAcceptorId(user.id, { limit: 100 });
    const completedCount = completedAsPublisher.rows.filter(t => t.status === 'completed').length
                        + completedAsAcceptor.rows.filter(t => t.status === 'completed').length;

    return res.json({ code: 200, data: { ...user, reviews, completedCount } });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
