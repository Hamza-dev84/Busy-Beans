
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const bcrypt = require("bcrypt");

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

  Image: {
    type: DataTypes.STRING,
    allowNull: true
  },

  partnerType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Partner Type cannot be empty"
      }
    }
  },

  status: {
    type: DataTypes.ENUM("active", "inactive"),
    defaultValue: "active"
  },

  creditLimit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
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
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Address cannot be empty"
      }
    }
  },

  title: {
    type: DataTypes.STRING
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

  shippingAddressLine1: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Shipping Address Line 1 cannot be empty"
      }
    }
  },

  shippingAddressLine2: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Shipping Address Line 2 cannot be empty"
      }
    }
  },

  shippingCountry: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Shipping Country cannot be empty"
      }
    }
  },

  shippingState: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Shipping State cannot be empty"
      }
    }
  },

  shippingCity: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Shipping City cannot be empty"
      }
    }
  },

  shippingZipCode: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Shipping Address Zip Code cannot be empty"
      }
    }
  },

  billingSameAsShipping: { type: DataTypes.BOOLEAN, defaultValue: true },
  billingAddressLine1: { type: DataTypes.STRING },
  billingAddressLine2: { type: DataTypes.STRING },
  billingCountry: { type: DataTypes.STRING },
  billingState: { type: DataTypes.STRING },
  billingCity: { type: DataTypes.STRING },
  billingZipCode: { type: DataTypes.STRING },

  stripeAccountId: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },

  stripeAccountStatus: {
    type: DataTypes.ENUM('pending', 'active'),
    allowNull: true,
    defaultValue: null
  },

}, { timestamps: true });

LocalPartner.beforeCreate(async (partner) => {
  partner.password = await bcrypt.hash(partner.password, 10);
});


module.exports = LocalPartner;