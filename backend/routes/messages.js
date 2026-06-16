const express = require('express');
const auth = require('../middleware/auth');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.get('/', auth, messageController.list);

module.exports = router;
