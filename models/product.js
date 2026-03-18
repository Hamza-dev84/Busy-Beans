
const {DataTypes} = require("sequelize");
const {sequelize} = require("../config/db");

const Product = sequelize.define("product", {
    
    image: {
        type: DataTypes.STRING, 
        allowNull: false,
        validate: {
            notNull: {
                msg: "Image cannot be null"
            }
        }
    },
    
    name: {
        type: DataTypes.STRING, 
        allowNull: false,
        validate: {
            notNull: {
                msg: "Name cannot be null"
            }
        }
    },
    
    weight: {
        type: DataTypes.STRING, 
        allowNull: false,
        validate: {
            notNull: {
                msg: "Weight cannot be null"
            }
        }
    },
    
    price: {
        type: DataTypes.FLOAT, 
        allowNull: false,
        validate: {
            notNull: {
                msg: "price cannot be null"
            }
        }
    },
    
    wholeSalePrice: {
        type: DataTypes.FLOAT, 
        allowNull: false,
        validate: {
            notNull: {
                msg: "whole sale price cannot be null"
            }
        }
    },
    
    productCode: {
        type: DataTypes.STRING, 
        allowNull: false,
        validate: {
            notNull: {
                msg: "product code cannot be null"
            }
        }
    },
    
    sku: {
        type: DataTypes.STRING, 
        allowNull: false,
        validate: {
            notNull: {
                msg: "sku cannot be null"
            }
        }
    },
    
    grind: {
        type: DataTypes.STRING, 
        allowNull: true
    },
    
    status: {
        type: DataTypes.ENUM("active", "inactive"), defaultValue: "active", 
        allowNull: false,
        validate: {
            notNull: {
                msg: "status cannot be null"
            }
        }
    },

})

module.exports = Product;