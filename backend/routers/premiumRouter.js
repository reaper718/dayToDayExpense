const express = require('express');
const router = express.Router();
const authenticateUser = require('../middelware/auth');
const premiumController = require('../controllers/premiumController');

router.get('/showLeaderboard',authenticateUser, premiumController.getSumOfAllExpenseByOrder);

module.exports = router;