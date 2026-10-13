const Users = require('../models/Users');
const Expenses = require('../models/Expenses');

const getSumOfAllExpenseByOrder = async (req, res) => {
    try {
        const result = await Users.findAll({
            attributes: ['id', 'name', 'totalExpense'],
            order: [['totalExpense', 'DESC']]
        });

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            error: error.message
        });
    }
};

module.exports = {
    getSumOfAllExpenseByOrder
};