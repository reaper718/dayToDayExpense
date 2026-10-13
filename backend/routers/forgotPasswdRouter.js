const express = require('express');
const router = express.Router();
const forgotPasswdController = require('../controllers/forgotPasswdController');

router.post('/forgotPassword',forgotPasswdController.forgotPassword);
router.get('/resetPassword/:id',forgotPasswdController.showResetPasswordForm);
router.post('/resetPassword/:id',forgotPasswdController.resetPassword);

module.exports = router;