const Task = require('../models/task');
const User = require('../models/user');
const db = require('../config/db');

const taskController = {
  async create(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (user.is_banned) return res.status(403).json({ code: 403, message: '账号已被禁用，无法发布任务' });

      const { title, description, category_id, reward, deadline, location, max_acceptors, pickup_location, delivery_location, subject } = req.body;

      // 跑腿代拿分类 (id=1) 必须填写代拿地和目的地
      if (parseInt(category_id) === 1) {
        if (!pickup_location || !pickup_location.trim()) {
          return res.status(400).json({ code: 400, message: '跑腿代拿任务必须填写代拿地' });
        }
        if (!delivery_location || !delivery_location.trim()) {
          return res.status(400).json({ code: 400, message: '跑腿代拿任务必须填写目的地' });
        }
      }

      // 学业互助分类 (id=2) 必须填写学科
      if (parseInt(category_id) === 2) {
        if (!subject || !subject.trim()) {
          return res.status(400).json({ code: 400, message: '学业互助任务必须填写学科' });
        }
      }

      const result = await Task.create({
        publisher_id: req.user.id,
        title, description, category_id, reward, deadline, location,
        max_acceptors: max_acceptors ? parseInt(max_acceptors) : null,
        pickup_location: pickup_location || null,
        delivery_location: delivery_location || null,
        subject: subject || null,
      });
      return res.status(201).json({ code: 201, message: '任务发布成功', data: { id: result.insertId } });
    } catch (err) {
      console.error('Create task error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async list(req, res) {
    try {
      const { category_id, status, keyword, subject, pickup_location, delivery_location, page = 1, limit = 10 } = req.query;
      const result = await Task.findAll({
        category_id, status, keyword, subject, pickup_location, delivery_location,
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
      task.acceptors = await Task.getAcceptors(req.params.id);
      task.acceptor_count = task.acceptors.length;
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
      if (task.status !== 'recruiting' && task.status !== 'in_progress') return res.status(400).json({ code: 400, message: '该任务当前不可接单' });

      const alreadyAccepted = await Task.hasAccepted(task.id, req.user.id);
      if (alreadyAccepted) return res.status(400).json({ code: 400, message: '您已接过此任务' });

      if (task.max_acceptors) {
        const count = await Task.getAcceptorCount(task.id);
        if (count >= task.max_acceptors) return res.status(400).json({ code: 400, message: `接单人数已达上限（${task.max_acceptors}人）` });
      }

      await Task.addAcceptor(task.id, req.user.id);

      if (task.status === 'recruiting') {
        await Task.updateStatus(task.id, 'in_progress');
      }

      return res.json({ code: 200, message: '接单成功' });
    } catch (err) {
      console.error('Accept task error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async getAcceptors(req, res) {
    try {
      const acceptors = await Task.getAcceptors(req.params.id);
      return res.json({ code: 200, data: acceptors });
    } catch (err) {
      console.error('Get acceptors error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

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

      await Task.clearAcceptor(task.id);
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

      const accepted = await Task.hasAccepted(task.id, req.user.id);
      if (!accepted) return res.status(403).json({ code: 403, message: '只有接单者可以放弃任务' });
      if (task.status !== 'in_progress') return res.status(400).json({ code: 400, message: '任务当前状态不可放弃' });

      await Task.removeAcceptor(task.id, req.user.id);

      // 若无剩余接单者，状态回退为 recruiting
      const remaining = await Task.getAcceptorCount(task.id);
      if (remaining === 0) {
        await db.execute("UPDATE tasks SET status = 'recruiting', publisher_confirmed = 0 WHERE id = ?", [task.id]);
      }

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
