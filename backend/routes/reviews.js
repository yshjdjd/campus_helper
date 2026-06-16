const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

router.post('/', auth, [
  body('task_id').isInt().withMessage('任务ID无效'),
  body('reviewee_id').isInt().withMessage('被评价者ID无效'),
  body('rating').isIn(['good', 'neutral', 'bad']).withMessage('评价等级只能是 good/neutral/bad'),
  body('comment').optional().isLength({ max: 500 }),
], validate, reviewController.create);

router.get('/user/:userId', reviewController.listByUser);
router.get('/task/:taskId', reviewController.listByTask);

module.exports = router;
