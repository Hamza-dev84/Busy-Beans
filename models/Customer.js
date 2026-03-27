
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const bcrypt = require("bcrypt");

const Customer = sequelize.define("customer", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    addressLine1: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Address Line 1 cannot be empty"
            }
        }
    },

    addressLine2: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Address Line 2 cannot be empty"
            }
        }
    },

    country: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Country cannot be empty"
            }
        }
    },

    state: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "State cannot be empty"
            }
        }
    },

    city: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "City cannot be empty"
            }
        }
    },

    zipCode: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Zip Code cannot be empty"
            }
        }
    },

    billingSameAsShipping: { type: DataTypes.BOOLEAN, defaultValue: true },
    billingAddress: { type: DataTypes.STRING },
    billingCountry: { type: DataTypes.STRING },
    billingState: { type: DataTypes.STRING },
    billingCity: { type: DataTypes.STRING },
    billingZipCode: { type: DataTypes.STRING },

    companyName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Compnay Name cannot be empty"
            }
        }
    },

    phoneCode: { type: DataTypes.STRING, defaultValue: "+1" },

    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Phone number cannot be empty"
            }
        }
    },

    saleTaxNumber: { type: DataTypes.STRING },
    dispatchEmail: { type: DataTypes.STRING },
    invoiceEmail: { type: DataTypes.STRING },

    userName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "User name cannot be empty"
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
    password: { type: DataTypes.STRING, allowNull: false },

}, { timestamps: true });


Customer.beforeSave(async (customer) => {
    if (customer.changed("password")) {
        customer.password = await bcrypt.hash(customer.password, 10);
    }
})

Customer.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
}


module.exports = Customer;