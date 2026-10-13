const {DataTypes} = require('sequelize');
const sequelize = require('../utils/db-connection');

const ForgotPasswordRequests = sequelize.define('ForgotPasswordRequests', {
    id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        isactive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }   
})

module.exports = ForgotPasswordRequests;
