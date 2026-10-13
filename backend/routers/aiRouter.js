const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authenticateUser = require('../middelware/auth');

router.post('/ai',aiController.interaction);

module.exports = router;