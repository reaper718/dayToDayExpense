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

module.exports = {
    addUser
}