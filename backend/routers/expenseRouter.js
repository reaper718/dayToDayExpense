const express = require('express');
const expenseController = require('../controllers/expenseController');
const router = express.Router();

router.get('/getExpense',expenseController.getExpenses);
router.post('/addExpense',expenseController.addExpense);
router.put('/editExpense/:id',expenseController.editExpense);
router.delete('/deleteExpense/:id',expenseController.deleteExpense);

module.exports = router;