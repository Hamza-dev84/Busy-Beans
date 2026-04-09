
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const OrderItem = sequelize.define("order_item", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Order Id cannot be empty"
            }
        }
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

}, { timestamps: false });

module.exports = OrderItem;
