const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * JWT authentication middleware.
 * Extracts token from Authorization header, verifies it,
 * and attaches decoded user info to req.user.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // { id, student_id, role }
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '令牌无效或已过期' });
  }
}

module.exports = authMiddleware;
