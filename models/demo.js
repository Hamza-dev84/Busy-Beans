
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const OrderTracking = sequelize.define("order_tracking", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM(
      "order_placed",
      "dispatched_to_supplier",
      "supplier_acknowledged",
      "shipped"
    ),
    allowNull: false,
  },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = OrderTracking;