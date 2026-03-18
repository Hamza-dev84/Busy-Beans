

const {DataTypes} = require("sequelize");
const {sequelize} = require("../config/db");
const bcrypt = require("bcrypt")

const Admin = sequelize.define("admin", {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Email cannot be null"
            }
        },
        unique: true,
        validate: {
            isEmail: {
                msg: "Email Should be unique"
            }
        }
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: "Password cannot be null"
            }
        }
    }
});

Admin.beforeCreate(async (admin) => {
    admin.password = await bcrypt.hash(admin.password, 10);
})

module.exports = Admin