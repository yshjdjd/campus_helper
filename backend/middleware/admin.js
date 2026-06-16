/**
 * Admin-only middleware.
 * Must be used after auth middleware (req.user must exist).
 */
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '需要管理员权限' });
  }
  next();
}

module.exports = adminMiddleware;
