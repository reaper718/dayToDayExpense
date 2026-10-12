const Users = require('../models/Users');

const addUser = async (req,res) => {
    try {
        const {email} = req.body;

        const user = await Users.findOne({
            where: {
                email: email
            }
        });

        if(user) {
            res.status(403).send("User already exists");
            return;
        }

        const newUser = await Users.create({
            ...req.body
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

       if(user.password != password) {
        return res.status(403).send("Incorrect Password");
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