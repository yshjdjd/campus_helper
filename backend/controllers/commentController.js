const Comment = require('../models/comment');
const Message = require('../models/message');
const Task = require('../models/task');
const User = require('../models/user');

const commentController = {
  async list(req, res) {
    try {
      const rows = await Comment.findByTask(req.params.taskId);
      // 嵌套回复：找出顶级评论，children 为子回复
      const top = rows.filter(c => !c.parent_id);
      const children = rows.filter(c => c.parent_id);
      const data = top.map(c => ({ ...c, children: children.filter(r => r.parent_id === c.id) }));
      return res.json({ code: 200, data });
    } catch (err) {
      console.error('List comments error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async create(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (user.is_banned) return res.status(403).json({ code: 403, message: '账号已被禁用' });

      const { content, parent_id } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ code: 400, message: '评论内容不能为空' });
      }

      const task = await Task.findById(req.params.taskId);
      if (!task) return res.status(404).json({ code: 404, message: '任务不存在' });
      // 校园反馈分类 (id=6) 允许所有人评论，其他分类仅参与者
      if (task.category_id !== 6) {
        // 检查是否为参与者
        const isPublisher = task.publisher_id === req.user.id;
        const isAcceptor = await Task.hasAccepted(task.id, req.user.id);
        if (!isPublisher && !isAcceptor) {
          return res.status(403).json({ code: 403, message: '仅任务参与者可以评论' });
        }
      }

      const result = await Comment.create({
        task_id: parseInt(req.params.taskId),
        user_id: req.user.id,
        content: content.trim(),
        parent_id: parent_id || null,
      });

      const myId = req.user.id;
      // 通知帖子发布者（如果评论者不是发布者）
      if (task.publisher_id !== myId && !parent_id) {
        await Message.create({
          task_id: task.id,
          sender_id: myId,
          receiver_id: task.publisher_id,
          content: `💬 评论了你的反馈「${task.title}」: ${content.trim().substring(0, 50)}`,
        });
        req.app.get('io')?.to(`user_${task.publisher_id}`).emit('new_message', {});
      }
      // 回复：通知被回复者
      if (parent_id) {
        const parentComment = await Comment.findByTask(task.id);
        const parent = parentComment.find(c => c.id === parseInt(parent_id));
        if (parent && parent.user_id !== myId) {
          await Message.create({
            task_id: task.id,
            sender_id: myId,
            receiver_id: parent.user_id,
            content: `💬 回复了你的评论: ${content.trim().substring(0, 50)}`,
          });
          req.app.get('io')?.to(`user_${parent.user_id}`).emit('new_message', {});
        }
      }

      return res.status(201).json({ code: 201, message: '回复成功', data: { id: result.insertId } });
    } catch (err) {
      console.error('Create comment error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async remove(req, res) {
    try {
      const result = await Comment.delete(req.params.id, req.user.id);
      if (result.affectedRows === 0) return res.status(404).json({ code: 404, message: '评论不存在或无权删除' });
      return res.json({ code: 200, message: '评论已删除' });
    } catch (err) {
      console.error('Delete comment error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },
};

module.exports = commentController;
