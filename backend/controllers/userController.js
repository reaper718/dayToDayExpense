const Users = require('../models/Users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const addUser = async (req,res) => {
    try {
        const {name, email, password} = req.body;

        const user = await Users.findOne({
            where: {
                email: email
            }
        });

        if (user) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPasswd = await bcrypt.hash(password,10);

        await Users.create({
            name: name,
            email: email,
            password: hashedPasswd
        })

        res.status(201).send("Users Created successfully!!!");
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

const getUser = async (req,res) => {
    try {
       const {email, password} = req.body;
       
       const user = await Users.findOne({
        where: {
            email: email
        }
       })

       if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

       const isPasswordValid = await bcrypt.compare(
        password,user.password
       )

       if(!isPasswordValid) {
        return res.status(401).send("Incorrect Password");
       }

       const token = jwt.sign({id: user.id},'secretKey');

       return res.status(200).json({
            message: "User logged in successfully",
            token: token,
            isPremium: user.isPremium
        });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

module.exports = {
    addUser,
    getUser
}