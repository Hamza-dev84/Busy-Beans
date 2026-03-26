


const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const bcrypt = require("bcrypt");

const Customer = sequelize.define("customer", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    companyName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Compnay Name cannot be empty"
            }
        }
    },
    userName: { 
        type: DataTypes.STRING, 
        allowNull: false,
        validate: {
            notNull: {
                msg: "Compnay Name cannot be empty"
            }
        }
    },
    email: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true,
        validate: {
            notNull: {
                msg: "Compnay Name cannot be empty"
            }
        } 
    },
    phone: { type: DataTypes.STRING },
    shippingAddress: { type: DataTypes.STRING },
    billingAddress: { type: DataTypes.STRING },
    password: { type: DataTypes.STRING, allowNull: false },
}, { timestamps: true });


Customer.beforeCreate(async (customer) => {
    customer.password = await bcrypt.hash(customer.password, 10);
})

Customer.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
}

Customer.prototype.toJSON = function () {
    const values = {...this.get()};
    delete values.password;
    return values;
}

module.exports = Customer;