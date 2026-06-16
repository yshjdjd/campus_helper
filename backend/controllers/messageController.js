const Message = require('../models/message');

const messageController = {
  async list(req, res) {
    try {
      const { taskId, page = 1, limit = 50 } = req.query;
      if (!taskId) return res.status(400).json({ code: 400, message: '缺少 taskId 参数' });

      const messages = await Message.findByTask(parseInt(taskId), {
        page: parseInt(page), limit: parseInt(limit),
      });

      await Message.markRead(parseInt(taskId), req.user.id);

      return res.json({ code: 200, data: messages });
    } catch (err) {
      console.error('List messages error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async conversations(req, res) {
    try {
      const conversations = await Message.findConversations(req.user.id);
      return res.json({ code: 200, data: conversations });
    } catch (err) {
      console.error('Conversations error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },
};

module.exports = messageController;
