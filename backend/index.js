const express = require('express');
const db = require('./utils/db-connection');
const cors = require('cors');
const User = require('./models/Users');
const Expense = require('./models/Expenses');

const userRouter = require('./routers/userRouter');
const expenseRouter = require('./routers/expenseRouter');

const app = express();

app.use(express.json())
app.use(cors());

app.use('/users',userRouter);
app.use('/expense',expenseRouter);

User.hasMany(Expense);
Expense.belongsTo(User);

db.sync().then(() => {
    app.listen(3000,() => {
    console.log("server is running ")
})
}).catch((err) => {
    console.log(err);
})

