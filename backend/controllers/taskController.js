const Task = require('../models/task');

const taskController = {
  async create(req, res) {
    try {
      const { title, description, category, reward, deadline, location } = req.body;
      const result = await Task.create({
        publisher_id: req.user.id,
        title, description, category, reward, deadline, location,
      });
      return res.status(201).json({ code: 201, message: '任务发布成功', data: { id: result.insertId } });
    } catch (err) {
      console.error('Create task error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async list(req, res) {
    try {
      const { category, status, keyword, page = 1, limit = 10 } = req.query;
      const result = await Task.findAll({
        category, status, keyword,
        page: parseInt(page),
        limit: parseInt(limit),
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
      if (!task) {
        return res.status(404).json({ code: 404, message: '任务不存在' });
      }
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

  async complete(req, res) {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ code: 404, message: '任务不存在' });
      if (task.publisher_id !== req.user.id) return res.status(403).json({ code: 403, message: '只有发布者可以确认完成' });
      if (task.status !== 'in_progress') return res.status(400).json({ code: 400, message: '任务当前状态不可完成' });

      await Task.updateStatus(task.id, 'completed');
      return res.json({ code: 200, message: '任务已完成' });
    } catch (err) {
      console.error('Complete task error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async cancel(req, res) {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ code: 404, message: '任务不存在' });

      const userId = req.user.id;
      if (task.publisher_id !== userId && task.acceptor_id !== userId) {
        return res.status(403).json({ code: 403, message: '无权取消此任务' });
      }
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
};

module.exports = taskController;
