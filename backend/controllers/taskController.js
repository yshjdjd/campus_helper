const Task = require('../models/task');
const User = require('../models/user');

const taskController = {
  async create(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (user.is_banned) return res.status(403).json({ code: 403, message: '账号已被禁用，无法发布任务' });

      const { title, description, category_id, reward, deadline, location } = req.body;
      const result = await Task.create({
        publisher_id: req.user.id,
        title, description, category_id, reward, deadline, location,
      });
      return res.status(201).json({ code: 201, message: '任务发布成功', data: { id: result.insertId } });
    } catch (err) {
      console.error('Create task error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async list(req, res) {
    try {
      const { category_id, status, keyword, page = 1, limit = 10 } = req.query;
      const result = await Task.findAll({
        category_id, status, keyword,
        page: parseInt(page), limit: parseInt(limit),
      });
      return res.json({ code: 200, data: result });
    } catch (err) {
      console.error('List tasks error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async detail(req, res) {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ code: 404, message: '任务不存在' });
      return res.json({ code: 200, data: task });
    } catch (err) {
      console.error('Task detail error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async accept(req, res) {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ code: 404, message: '任务不存在' });
      if (task.publisher_id === req.user.id) return res.status(400).json({ code: 400, message: '不能接自己发布的任务' });
      if (task.status !== 'recruiting') return res.status(400).json({ code: 400, message: '该任务当前不可接单' });

      await Task.updateStatus(task.id, 'in_progress', req.user.id);
      return res.json({ code: 200, message: '接单成功' });
    } catch (err) {
      console.error('Accept task error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  /**
   * 确认完成（双方都需要确认）
   */
  async confirm(req, res) {
    try {
      const result = await Task.confirmCompletion(req.params.id, req.user.id);
      if (result.bothConfirmed) {
        return res.json({ code: 200, message: '双方已确认，任务已完成', data: { bothConfirmed: true } });
      }
      return res.json({ code: 200, message: '已确认，等待对方确认', data: { bothConfirmed: false } });
    } catch (err) {
      if (err.message === '任务不存在') return res.status(404).json({ code: 404, message: err.message });
      if (err.message === '无权确认此任务') return res.status(403).json({ code: 403, message: err.message });
      if (err.message === '任务当前状态不可确认完成') return res.status(400).json({ code: 400, message: err.message });
      console.error('Confirm task error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async cancel(req, res) {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ code: 404, message: '任务不存在' });
      if (task.publisher_id !== req.user.id) return res.status(403).json({ code: 403, message: '只有发布者可以取消任务' });
      if (task.status === 'completed' || task.status === 'cancelled') {
        return res.status(400).json({ code: 400, message: '任务当前状态不可取消' });
      }

      await Task.updateStatus(task.id, 'cancelled');
      return res.json({ code: 200, message: '任务已取消' });
    } catch (err) {
      console.error('Cancel task error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async abandon(req, res) {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ code: 404, message: '任务不存在' });
      if (task.acceptor_id !== req.user.id) return res.status(403).json({ code: 403, message: '只有接单者可以放弃任务' });
      if (task.status !== 'in_progress') return res.status(400).json({ code: 400, message: '任务当前状态不可放弃' });

      await Task.clearAcceptor(task.id);
      return res.json({ code: 200, message: '已放弃任务' });
    } catch (err) {
      console.error('Abandon task error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async myPublished(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await Task.findByPublisherId(req.user.id, {
        page: parseInt(page), limit: parseInt(limit),
      });
      return res.json({ code: 200, data: result });
    } catch (err) {
      console.error('My published error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async myAccepted(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await Task.findByAcceptorId(req.user.id, {
        page: parseInt(page), limit: parseInt(limit),
      });
      return res.json({ code: 200, data: result });
    } catch (err) {
      console.error('My accepted error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async completedByUser(req, res) {
    try {
      const tasks = await Task.findCompletedByUser(req.params.userId);
      return res.json({ code: 200, data: tasks });
    } catch (err) {
      console.error('Completed by user error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },
};

module.exports = taskController;
