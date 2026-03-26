
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Product = require("./product");
const Admin = require("./admin");
const OrderTracking = require("./OrderTracking");

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

Product.hasMany(OrderItem, {foreignKey: "productId"});
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
OrderTracking.belongsTo(Order, {foreignKey: "orderId"});

module.exports = { Order, OrderItem, Product, Admin, OrderTracking };
