
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Product = require("./Product");
const Admin = require("./Admin");
const OrderTracking = require("./OrderTracking");
const Customer = require("./Customer");
const LocalPartner = require("./LocalPartner");
const PartnerProduct = require("./PartnerProduct");
const OrderProfit = require("./OrderProfit");
const Supplier = require("./Supplier");

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

Order.hasMany(OrderTracking, { foreignKey: "orderId", as: "tracking" });
OrderTracking.belongsTo(Order, { foreignKey: "orderId" });

Order.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Customer.hasMany(Order, { foreignKey: "customerId", as: "orders" });

Order.belongsTo(LocalPartner, { foreignKey: "localPartnerId", as: "partner" });
LocalPartner.hasMany(Order, { foreignKey: "localPartnerId", as: "orders" });

Customer.belongsTo(LocalPartner, { foreignKey: "localPartnerId", as: "localPartner" });
LocalPartner.hasMany(Customer, { foreignKey: "localPartnerId", as: "customers" });

LocalPartner.hasMany(PartnerProduct, { foreignKey: "partnerId", as: "partnerProducts" });
PartnerProduct.belongsTo(LocalPartner, { foreignKey: "partnerId" });

PartnerProduct.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(PartnerProduct, { foreignKey: "productId", as: "partnerProducts" });

Order.hasOne(OrderProfit, { foreignKey: "orderId", as: "profit" });
OrderProfit.belongsTo(Order, { foreignKey: "orderId" });
OrderProfit.belongsTo(LocalPartner, { foreignKey: "partnerId", as: "partner" });

Order.belongsTo(Supplier, { foreignKey: "supplierId", as: "supplier" });
Supplier.hasMany(Order, { foreignKey: "supplierId", as: "orders" });

module.exports = {
    Order, OrderItem, Product, Admin, OrderTracking,
    Customer, LocalPartner,
    PartnerProduct, OrderProfit
};