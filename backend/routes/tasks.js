const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const taskController = require('../controllers/taskController');

const router = express.Router();

router.post('/', auth, [
  body('title').notEmpty().withMessage('标题不能为空').isLength({ max: 128 }),
  body('description').notEmpty().withMessage('描述不能为空'),
  body('category').isIn(['errand', 'study', 'recruit', 'life']).withMessage('无效的任务分类'),
  body('reward').optional().isFloat({ min: 0 }),
  body('deadline').optional().isISO8601(),
  body('location').optional().isLength({ max: 255 }),
], validate, taskController.create);

router.get('/', taskController.list);
router.get('/:id', taskController.detail);
router.put('/:id/accept', auth, taskController.accept);
router.put('/:id/complete', auth, taskController.complete);
router.put('/:id/cancel', auth, taskController.cancel);

module.exports = router;
