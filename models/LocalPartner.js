
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const LocalPartner = sequelize.define("local_partner", {
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

  territory: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "territory cannot be empty"
      }
    }
  },

  partnerType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "partner type cannot be empty"
      }
    }
  },

  status: {
    type: DataTypes.ENUM("active", "inactive"),
    defaultValue: "active"
  },

}, { timestamps: true });

module.exports = LocalPartner;