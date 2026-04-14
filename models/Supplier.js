
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const bcrypt = require("bcrypt");

const Supplier = sequelize.define("supplier", {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },

  name: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      notNull: {
        msg: "Name cannot be empty"
      }
    }
  },

  image: {
    type: DataTypes.STRING,
    allowNull: true
  },

  business_website: {
    type: DataTypes.STRING,
    allowNull: true
  },

  supplierType: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      notNull: {
        msg: "Supplier Type cannot be empty"
      }
    } 
  },

  status: { 
    type: DataTypes.ENUM("active", "inactive"), 
    defaultValue: "active" 
  },

  registerDate: {
    type: DataTypes.DATE,
    allowNull: false
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

  address1: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      notNull: {
        msg: "Address 1 cannot be empty"
      }
     } 
  },

  address2: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      notNull: {
        msg: "Address 2 cannot be empty"
      }
     } 
  },

  countryCode: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      notNull: {
        msg: "Country code cannot be empty"
      }
     } 
  },

  phone: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      notNull: {
        msg: "Phone cannot be empty"
      }
     } 
  },

  bankAccountDetail: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      notNull: {
        msg: "bank Account Detail cannot be empty"
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
     }, 
    unique: true 
  },

  password: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      notNull: {
        msg: "Password cannot be empty"
      }
     } 
  },

}, { timestamps: true });

Supplier.beforeCreate(async (supplier) => {
  supplier.password = await bcrypt.hash(supplier.password, 10);
});

module.exports = Supplier;