
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const InvoiceItem = sequelize.define("invoice_item", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING
    },

    name: {
        type: DataTypes.STRING,
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

module.exports = InvoiceItem;