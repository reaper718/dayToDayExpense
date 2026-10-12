const Users = require('../models/Users');
const bcrypt = require('bcrypt');

const addUser = async (req,res) => {
    try {
        const {name, email, password} = req.body;

        const user = await Users.findOne({
            where: {
                email: email
            }
        });

        if(user) {
            res.status(403).send("User already exists");
            return;
        }

        const hashedPasswd = await bcrypt.hash(password,10);
        console.log(hashedPasswd)

        const newUser = await Users.create({
            name: name,
            email: email,
            password: hashedPasswd
        })

        res.status(201).send("Users Created successfully!!!");
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
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

       if(!user) {
        return res.status(404).send("user not found");
       }

       const isPasswordValid = await bcrypt.compare(
        password,user.password
       )

       if(isPasswordValid) {
        return res.status(401).send("Incorrect Password");
       }

       return res.status(200).send("user logged in successfully");
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

module.exports = {
    addUser,
    getUser
}