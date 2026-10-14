const express = require('express');
const router = express.Router();
const authenticateUser = require('../middelware/auth');
const premiumController = require('../controllers/premiumController');
const reportController = require('../controllers/reportController');

router.get('/showLeaderboard',authenticateUser, premiumController.getSumOfAllExpenseByOrder);

router.get('/report', authenticateUser, reportController.getExpenseReport);

module.exports = router;