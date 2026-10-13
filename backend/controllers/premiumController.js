const Users = require('../models/Users');
const Expenses = require('../models/Expenses');
const { Sequelize } = require('sequelize');

const getSumOfAllExpenseByOrder = async (req,res) => {
    try {
        const result = await Expenses.findAll({
            attributes: [
                'UserId',
                [Sequelize.fn('SUM', Sequelize.col('expense')), 'totalExpense']
            ],
            include: [
                {
                    model: Users,
                    attributes: ['name'],
                    required: true
                }
            ],
            group: ['UserId','User.id','User.name'],
            order: [[Sequelize.literal('totalExpense'), 'DESC']]
        });

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: error
        })
    }
}

module.exports = {
    getSumOfAllExpenseByOrder
}