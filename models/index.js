
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Product = require("./Product");
const Admin = require("./Admin");
const OrderTracking = require("./OrderTracking");
const Customer = require("./customer");

OrderItem.belongsTo(Order, { foreignKey: "orderId" });
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });

Product.hasMany(OrderItem, {foreignKey: "productId"});
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

Order.hasMany(OrderTracking, { foreignKey: "orderId", as: "tracking" });
OrderTracking.belongsTo(Order, { foreignKey: "orderId" });

Customer.hasMany(Order, { foreignKey: "customerId", as: "orders" });
Order.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });

module.exports = { Order, OrderItem, Product, Admin, OrderTracking, Customer };
