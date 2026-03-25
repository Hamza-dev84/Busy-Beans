
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Product = require("./product");
const Admin = require("./admin");

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

Product.hasMany(OrderItem, {foreignKey: "productId"});
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

module.exports = { Order, OrderItem, Product, Admin };

