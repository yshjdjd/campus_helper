const Category = require('../models/category');
const User = require('../models/user');

const adminController = {
  async listCategories(req, res) {
    try {
      const includeInactive = req.query.all === '1';
      const categories = await Category.findAll({ includeInactive });
      return res.json({ code: 200, data: categories });
    } catch (err) {
      console.error('List categories error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async createCategory(req, res) {
    try {
      const { name, sort_order, template_config, allowed_roles } = req.body;
      if (!name) return res.status(400).json({ code: 400, message: '分类名称不能为空' });
      const result = await Category.create({ name, sort_order, template_config, allowed_roles });
      return res.status(201).json({ code: 201, message: '分类创建成功', data: { id: result.insertId } });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ code: 409, message: '分类名称已存在' });
      }
      console.error('Create category error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async updateCategory(req, res) {
    try {
      const { name, sort_order, is_active, template_config, allowed_roles } = req.body;
      await Category.update(req.params.id, { name, sort_order, is_active, template_config, allowed_roles });
      return res.json({ code: 200, message: '分类更新成功' });
    } catch (err) {
      console.error('Update category error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async deleteCategory(req, res) {
    try {
      const FIXED_IDS = [1, 2, 3, 4, 5, 6]; // 跑腿代拿、学业互助、招募组队、生活交易、消息通知、校园反馈
      if (FIXED_IDS.includes(parseInt(req.params.id))) {
        return res.status(400).json({ code: 400, message: '固定分类不可删除' });
      }
      await Category.delete(req.params.id);
      return res.json({ code: 200, message: '分类删除成功' });
    } catch (err) {
      console.error('Delete category error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async listUsers(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await User.findAll({ page: parseInt(page), limit: parseInt(limit) });
      return res.json({ code: 200, data: result });
    } catch (err) {
      console.error('List users error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async banUser(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
      if (user.role === 'admin') return res.status(400).json({ code: 400, message: '不能禁用管理员' });
      await User.updateBan(req.params.id, true);
      return res.json({ code: 200, message: '用户已禁用' });
    } catch (err) {
      console.error('Ban user error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async unbanUser(req, res) {
    try {
      await User.updateBan(req.params.id, false);
      return res.json({ code: 200, message: '用户已解禁' });
    } catch (err) {
      console.error('Unban user error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async toggleFeatured(req, res) {
    try {
      const db = require('../config/db');
      const task = await require('../models/task').findById(req.params.id);
      if (!task) return res.status(404).json({ code: 404, message: '任务不存在' });
      await db.execute('UPDATE tasks SET is_featured = ? WHERE id = ?', [task.is_featured ? 0 : 1, req.params.id]);
      return res.json({ code: 200, message: task.is_featured ? '已取消精华' : '已设为精华' });
    } catch (err) {
      console.error('Toggle featured error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },
};

module.exports = adminController;
