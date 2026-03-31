
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Product = require("./product");
const Admin = require("./admin");
const OrderTracking = require("./OrderTracking");
const Customer = require("./Customer");
const LocalPartner = require("./LocalPartner");
const Invoice = require("./Invoice");
const InvoiceItem = require("./InvoiceItem");

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

Order.hasMany(OrderTracking, { foreignKey: "orderId", as: "tracking" });
OrderTracking.belongsTo(Order, { foreignKey: "orderId" });

Customer.hasMany(Order, { foreignKey: "customerId", as: "orders" });
Order.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });

LocalPartner.hasMany(Order, { foreignKey: "localPartnerId", as: "orders" });
Order.belongsTo(LocalPartner, { foreignKey: "localPartnerId", as: "partner" });

Invoice.hasMany(InvoiceItem, { foreignKey: "invoiceId", as: "items" });
InvoiceItem.belongsTo(Invoice, { foreignKey: "invoiceId" });

module.exports = { 
    Order, 
    OrderItem, 
    Product, 
    Admin, 
    OrderTracking, 
    Customer, 
    LocalPartner, 
    Invoice, 
    InvoiceItem 
};