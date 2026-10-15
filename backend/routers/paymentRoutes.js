const express = require('express');
const router = express.Router();

const authenticateUser = require('../middelware/auth');
const paymentController = require('../controllers/paymentController');

router.post('/create-order', authenticateUser, paymentController.createOrder);
router.get('/verify',authenticateUser,paymentController.verifyPayment)

module.exports = router;