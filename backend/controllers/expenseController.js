const Expense = require('../models/Expenses');

const addExpense = async (req,res) => {
    try {
        console.log(req);
        const expense = await Expense.create({
            ...req.body,
            UserId: req.user.id
        })

        
        res.status(200).json(expense);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

const getExpenses = async (req,res) =>{
    try {
        const expenses = await Expense.findAll({
            where: {
                UserId: req.user.id
            }
        });

        res.status(200).json(expenses);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

const deleteExpense = async (req,res) => {
    try {
        const {id} = req.params;

        const expense = await Expense.destroy({
            where: {
                id: id,
                UserId: req.user.id
            }
        })

        if(!expense) {
            res.status(404).send("Expense not found");
            return;
        }

        res.status(200).send("Expense deleted");
        
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

const editExpense = async (req,res) => {
    try {
        const {id} = req.params;
        const {expense, description , category} = req.body;

        const expenses = await Expense.findOne({
            where: {
                id: id,
                UserId: req.user.id
            }
        })

        if(!expenses) {
            res.status(404).send("Expense not found");
            return;
        }

        await expenses.update({
            expense,
            description,
            category
        })

        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).send(error);
    }
}

module.exports = {
    addExpense,
    getExpenses,
    deleteExpense,
    editExpense
}