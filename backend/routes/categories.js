const express = require('express');
const Category = require('../models/category');

const router = express.Router();

// GET /api/categories — 公开接口，获取启用的分类列表
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({ includeInactive: false });
    return res.json({ code: 200, data: categories });
  } catch (err) {
    console.error('List categories error:', err);
    return res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
