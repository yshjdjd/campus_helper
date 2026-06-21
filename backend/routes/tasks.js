const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const taskController = require('../controllers/taskController');

const router = express.Router();

router.get('/my/published', auth, taskController.myPublished);
router.get('/my/accepted', auth, taskController.myAccepted);
router.get('/completed/:userId', taskController.completedByUser);

router.post('/', auth, [
  body('title').notEmpty().withMessage('标题不能为空').isLength({ max: 128 }),
  body('description').notEmpty().withMessage('描述不能为空'),
  body('category_id').isInt().withMessage('分类ID无效'),
  body('reward').optional().isFloat({ min: 0 }),
  body('deadline').optional().isISO8601(),
  body('location').optional().isLength({ max: 255 }),
  body('max_acceptors').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('接单人数上限必须为正整数'),
], validate, taskController.create);

router.get('/', taskController.list);
router.get('/:id', taskController.detail);
router.get('/:id/acceptors', taskController.getAcceptors);
router.put('/:id/accept', auth, taskController.accept);
router.put('/:id/confirm', auth, taskController.confirm);
router.put('/:id/cancel', auth, taskController.cancel);
router.put('/:id/abandon', auth, taskController.abandon);

module.exports = router;
