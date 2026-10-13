const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection"); // Use your actual DB connection path

const Orders = sequelize.define("Orders", {
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("PENDING", "SUCCESSFUL", "FAILED"),
    allowNull: false,
    defaultValue: "PENDING",
  },
});

module.exports = Orders;