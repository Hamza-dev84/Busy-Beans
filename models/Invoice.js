
const {sequelize} = require("../config/db");
const {DataTypes} = require("sequelize");

const Invoice = sequelize.define("invoice", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    companyName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Company name cannot be empty"
            }
        }
    },

    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Email cannot be empty"
            }
        }
    },

    address: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Address cannot be empty"
            }
        }
    },

    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Payment method cannot be empty"
            }
        }
    },

    noteForSupplier: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Invoice Number cannot be empty"
            }
        }
    },

    PO_number: {
        type :DataTypes.STRING,
        allowNull: true,
    },

    invoiceDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },

    days: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Days cannot be empty"
            }
        }
    },

    totalWeight: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },

    shippingCharges: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    }, 

    totalUSD: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },

    comments: {
        type: DataTypes.TEXT
    },

    emailToCustomer: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {timestamps: true})

module.exports = Invoice;