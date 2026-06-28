const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/categories', auth, admin, adminController.listCategories);
router.post('/categories', auth, admin, [
  body('name').notEmpty().withMessage('分类名称不能为空'),
  body('sort_order').optional().isInt({ min: 0 }),
], validate, adminController.createCategory);
router.put('/categories/:id', auth, admin, adminController.updateCategory);
router.delete('/categories/:id', auth, admin, adminController.deleteCategory);

router.get('/users', auth, admin, adminController.listUsers);
router.put('/users/:id/ban', auth, admin, adminController.banUser);
router.put('/users/:id/unban', auth, admin, adminController.unbanUser);
router.put('/tasks/:id/featured', auth, admin, adminController.toggleFeatured);

module.exports = router;
