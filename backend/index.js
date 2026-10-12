const express = require('express');
const db = require('./utils/db-connection');
const cors = require('cors');

const userRouter = require('./routers/userRouter');

const app = express();

app.use(express.json())
app.use(cors());

app.use('/users',userRouter);


db.sync().then(() => {
    app.listen(3000,() => {
    console.log("server is running ")
})
}).catch((err) => {
    console.log(err);
})

