const Expense = require('../models/Expenses');
const User = require('../models/Users');
const sequelize = require('../utils/db-connection');

const addExpense = async (req, res) => {
    const transaction = await Expense.sequelize.transaction();

    try {
        const { expense, description, note, category } = req.body;
        const userId = req.user.id;

        const newExpense = await Expense.create({
            expense,
            description,
            note,
            category,
            UserId: userId
        }, { transaction });

        await User.increment(
            { totalExpense: expense },
            {
                where: { id: userId },
                transaction
            }
        );

        await transaction.commit();

        res.status(201).json(newExpense);
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).send(error.message);
    }
};

const getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.findAll({
            where: {
                UserId: req.user.id
            }
        });

        res.status(200).json(expenses);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
};

const deleteExpense = async (req, res) => {
    const transaction = await Expense.sequelize.transaction();

    try {
        const { id } = req.params;
        const userId = req.user.id;

        const expenseRecord = await Expense.findOne({
            where: {
                id,
                UserId: userId
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!expenseRecord) {
            await transaction.rollback();
            return res.status(404).send('Expense not found');
        }

        await User.decrement(
            { totalExpense: expenseRecord.expense },
            {
                where: { id: userId },
                transaction
            }
        );

        await expenseRecord.destroy({ transaction });

        await transaction.commit();

        res.status(200).send('Expense deleted');
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).send(error.message);
    }
};

const editExpense = async (req, res) => {
    const transaction = await Expense.sequelize.transaction();

    try {
        const { id } = req.params;
        const { expense, description, category } = req.body;
        const userId = req.user.id;

        const expenseRecord = await Expense.findOne({
            where: {
                id,
                UserId: userId
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!expenseRecord) {
            await transaction.rollback();
            return res.status(404).send('Expense not found');
        }

        const oldAmount = Number(expenseRecord.expense);
        const newAmount = Number(expense);
        const difference = newAmount - oldAmount;

        await expenseRecord.update({
            expense,
            description,
            category
        }, { transaction });

        if (difference !== 0) {
            await User.increment(
                { totalExpense: difference },
                {
                    where: { id: userId },
                    transaction
                }
            );
        }

        await transaction.commit();

        res.status(200).json(expenseRecord);
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).send(error.message);
    }
};

module.exports = {
    addExpense,
    getExpenses,
    deleteExpense,
    editExpense
};
