
const {DataTypes} = require("sequelize");
const {sequelize} = require("../config/db");

const OrderProfit = sequelize.define("order_profit", {
    id:  {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    partnerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    orderTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    wholeSaleTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    shippingCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    adminReceives: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    partnerProfit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
})

module.exports = OrderProfit;