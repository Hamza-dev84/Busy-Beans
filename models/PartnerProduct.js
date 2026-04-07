
const {DataTypes} = require("sequelize");
const {sequelize} = require("../config/db");

const PartnerProduct = sequelize.define("partner_product", {
    id: {
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true
    },

    partnerId: {
        type: DataTypes.INTEGER, 
        allowNull: false,
        validate: {
            notNull: {
                msg: "Partner Id cannot be empty"
            }
        }
    },

    productId: {
        type: DataTypes.INTEGER, 
        allowNull: false,
        validate: {
            notNull: {
                msg: "Product Id cannot be empty"
            }
        }
    },

    sellingPrice: {
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: true
    },

    wholesalePrice: {
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: true
    },

}, {timestamps: true})

module.exports = PartnerProduct;