
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Order = sequelize.define("order", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    customerId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    localPartnerId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    isLocalPartner: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    paymentMethod: {
        type: DataTypes.ENUM("card", "bank_check"),
        allowNull: false,
        validate: {
            notNull: {
                msg: "Payment method cannot be empty"
            }
        }
    },

    orderFrequency: {
        type: DataTypes.ENUM("Once", "Weekly", "every_two_weeks", "every_four_weeks"),
        allowNull: false,
        validate: {
            notNull: {
                msg: "Order Frequency cannot be empty"
            }
        }
    },

    noteForSupplier: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    purchaseOrderNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },

    subtotal: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },

    shippingCharges: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },

    total: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },

    currentStatus: {
        type: DataTypes.ENUM(
            "order_placed",
            "dispatched_to_supplier",
            "supplier_acknowledged",
            "shipped",
            "cancelled"
        ),
        defaultValue: "order_placed"
    },

    status: {
        type: DataTypes.ENUM("pending", "completed", "cancelled"),
        defaultValue: "pending"
    }

}, { timestamps: true });

module.exports = Order;