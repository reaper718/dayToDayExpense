const {Sequelize} = require('sequelize');

const sequelize = new Sequelize('expenses', 'root','root', {
    host: 'localhost',
    dialect: 'mysql'
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log("Conection to database made");
    } catch (error) {   
        console.log(error);
    }
})();

module.exports = sequelize;
