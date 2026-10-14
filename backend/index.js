const express = require('express');
const db = require('./utils/db-connection');
const cors = require('cors');
const User = require('./models/Users');
const Expense = require('./models/Expenses');
const Orders = require('./models/Orders');
const forgotPassword = require('./models/ForgotPasswordRequests');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');

const userRouter = require('./routers/userRouter');
const expenseRouter = require('./routers/expenseRouter');
const paymentRouter = require('./routers/paymentRoutes');
const premiumRouter = require('./routers/premiumRouter');
const aiRouter = require('./routers/aiRouter');
const forgotPassedRouter = require('./routers/forgotPasswdRouter');

const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});

app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.use(cors());
app.use(express.static(path.join(__dirname,"../frontend")));
app.use(morgan('combined', {stream: accessLogStream}));

app.use('/users',userRouter);
app.use('/expense',expenseRouter);
app.use('/payment',paymentRouter);
app.use('/premium',premiumRouter);
app.use('/',aiRouter);
app.use('/password',forgotPassedRouter)

User.hasMany(Expense);
Expense.belongsTo(User);

User.hasMany(Orders);
Orders.belongsTo(User);

User.hasMany(forgotPassword);
forgotPassword.belongsTo(User);

db.sync().then(() => {
    app.listen(3000,() => {
    console.log("server is running ")
})
}).catch((err) => {
    console.log(err);
})

