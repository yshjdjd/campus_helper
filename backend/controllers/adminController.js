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
      const { name, sort_order } = req.body;
      if (!name) return res.status(400).json({ code: 400, message: '分类名称不能为空' });
      const result = await Category.create({ name, sort_order });
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
      const { name, sort_order, is_active } = req.body;
      await Category.update(req.params.id, { name, sort_order, is_active });
      return res.json({ code: 200, message: '分类更新成功' });
    } catch (err) {
      console.error('Update category error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async deleteCategory(req, res) {
    try {
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
};

module.exports = adminController;
