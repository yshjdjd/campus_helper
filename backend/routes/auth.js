const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', [
  body('student_id').notEmpty().withMessage('学号不能为空'),
  body('username').notEmpty().withMessage('昵称不能为空').isLength({ min: 2, max: 64 }),
  body('password').notEmpty().withMessage('密码不能为空').isLength({ min: 6 }),
  body('school_email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('role').optional().isIn(['student', 'teacher']).withMessage('身份只能是 student 或 teacher'),
], validate, authController.register);

router.post('/login', [
  body('student_id').notEmpty().withMessage('学号不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
], validate, authController.login);

router.get('/profile', auth, authController.profile);

module.exports = router;
