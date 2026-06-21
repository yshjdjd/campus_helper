const { validationResult } = require('express-validator');

/**
 * Validation middleware wrapper.
 * Use after express-validator chain to check results.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: '参数验证失败',
      errors: errors.array().map(e => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
}

module.exports = validate;
