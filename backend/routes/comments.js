const express = require('express');
const auth = require('../middleware/auth');
const commentController = require('../controllers/commentController');

const router = express.Router();

router.get('/task/:taskId', commentController.list);
router.post('/task/:taskId', auth, commentController.create);
router.delete('/:id', auth, commentController.remove);

module.exports = router;
