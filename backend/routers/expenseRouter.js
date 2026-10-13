const express = require('express');
const router = express.Router();

const expenseController = require('../controllers/expenseController');

const authenticateUser = require('../middelware/auth');

router.get('/getExpense',authenticateUser,expenseController.getExpenses);
router.post('/addExpense',authenticateUser,expenseController.addExpense);
router.put('/editExpense/:id',authenticateUser,expenseController.editExpense);
router.delete('/deleteExpense/:id',authenticateUser,expenseController.deleteExpense);

module.exports = router;