const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../config');

const SALT_ROUNDS = 10;

const authController = {
  async register(req, res) {
    try {
      const { student_id, username, password, school_email, role } = req.body;

      if (!school_email.endsWith(config.schoolEmailDomain)) {
        return res.status(400).json({ code: 400, message: `邮箱必须以 ${config.schoolEmailDomain} 结尾` });
      }

      const existingUser = await User.findByStudentId(student_id);
      if (existingUser) {
        return res.status(409).json({ code: 409, message: '学号已注册' });
      }
      const existingEmail = await User.findByEmail(school_email);
      if (existingEmail) {
        return res.status(409).json({ code: 409, message: '邮箱已注册' });
      }

      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
      await User.create({ student_id, username, password_hash, school_email, role });

      return res.status(201).json({ code: 201, message: '注册成功' });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async login(req, res) {
    try {
      const { student_id, password } = req.body;

      const user = await User.findByStudentId(student_id);
      if (!user) {
        return res.status(401).json({ code: 401, message: '学号或密码错误' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ code: 401, message: '学号或密码错误' });
      }

      const token = jwt.sign(
        { id: user.id, student_id: user.student_id, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return res.json({
        code: 200,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            student_id: user.student_id,
            username: user.username,
            school_email: user.school_email,
            avatar: user.avatar,
            role: user.role,
            credit_score: user.credit_score,
          },
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },

  async profile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
      }
      return res.json({ code: 200, data: user });
    } catch (err) {
      console.error('Profile error:', err);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  },
};

module.exports = authController;
