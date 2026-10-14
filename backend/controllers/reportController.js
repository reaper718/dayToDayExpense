
const { Op } = require('sequelize');
const Users = require('../models/Users');
const Expenses = require('../models/Expenses');

const getExpenseReport = async (req, res) => {
    try {
        // Verify premium status from the database
        const user = await Users.findByPk(req.user.id);

        if (!user || !user.isPremium) {
            return res.status(403).json({
                message: 'Premium membership is required to access reports.'
            });
        }

        const {
            period = 'monthly',
            date,
            type = 'all'
        } = req.query;

        if (!['all', 'daily', 'weekly', 'monthly'].includes(period)) {
            return res.status(400).json({ message: 'Invalid period.' });
        }

        if (!['all', 'income', 'expense'].includes(type)) {
            return res.status(400).json({ message: 'Invalid report type.' });
        }

        const referenceDate = date
            ? new Date(`${date}T00:00:00`)
            : new Date();

        if (Number.isNaN(referenceDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date.' });
        }

        let startDate;
        let endDate;

        if (period === 'daily') {
            startDate = new Date(referenceDate);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
        } else if (period === 'weekly') {
            startDate = new Date(referenceDate);
            const day = startDate.getDay();
            startDate.setDate(
                startDate.getDate() - ((day + 6) % 7)
            );
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);
        } else if (period === 'monthly') {
            startDate = new Date(
                referenceDate.getFullYear(),
                referenceDate.getMonth(),
                1
            );
            endDate = new Date(
                referenceDate.getFullYear(),
                referenceDate.getMonth() + 1,
                1
            );
        }

        const where = {
            UserId: req.user.id
        };

        if (startDate && endDate) {
            where.createdAt = {
                [Op.gte]: startDate,
                [Op.lt]: endDate
            };
        }

        // This application currently stores expenses, not income.
        const expenses = type === 'income'
            ? []
            : await Expenses.findAll({
                where,
                attributes: [
                    'id',
                    'expense',
                    'description',
                    'category',
                    'createdAt'
                ],
                order: [['createdAt', 'DESC']]
            });

        const transactions = expenses.map(item => ({
            date: item.createdAt.toISOString().slice(0, 10),
            description: item.description,
            category: item.category,
            type: 'expense',
            amount: Number(item.expense)
        }));

        const totalExpenses = transactions.reduce(
            (sum, item) => sum + item.amount,
            0
        );

        return res.status(200).json({
            period,
            type,
            totalIncome: 0,
            totalExpenses,
            savings: -totalExpenses,
            transactions
        });

    } catch (error) {
        console.error('Report generation error:', error);
        return res.status(500).json({
            message: 'Unable to generate expense report.'
        });
    }
};

module.exports = { getExpenseReport };
