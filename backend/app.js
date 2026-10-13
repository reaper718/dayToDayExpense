const express = require('express');
const db = require('./utils/db-connection');
const cors = require('cors');
const User = require('./models/Users');
const Expense = require('./models/Expenses');
const Orders = require('./models/Orders');
const path = require('path');

const userRouter = require('./routers/userRouter');
const expenseRouter = require('./routers/expenseRouter');
const paymentRouter = require('./routers/paymentRoutes');
const premiumRouter = require('./routers/premiumRouter');
const aiRouter = require('./routers/aiRouter');

const app = express();

app.use(express.json())
app.use(cors());
app.use(express.static(path.join(__dirname,"../frontend")));

app.use('/users',userRouter);
app.use('/expense',expenseRouter);
app.use('/payment',paymentRouter);
app.use('/premium',premiumRouter);
app.use('/',aiRouter);

User.hasMany(Expense);
Expense.belongsTo(User);

User.hasMany(Orders);
Orders.belongsTo(User);

db.sync().then(() => {
    app.listen(3000,() => {
    console.log("server is running ")
})
}).catch((err) => {
    console.log(err);
})

