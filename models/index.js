
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Product = require("./Product");
const Admin = require("./Admin");
const OrderTracking = require("./OrderTracking");
const Customer = require("./Customer");
const LocalPartner = require("./LocalPartner");
const Invoice = require("./Invoice");
const InvoiceItem = require("./InvoiceItem");
const PartnerProduct = require("./PartnerProduct");
const OrderProfit = require("./OrderProfit");

Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

Order.hasMany(OrderTracking, { foreignKey: "orderId", as: "tracking" });
OrderTracking.belongsTo(Order, { foreignKey: "orderId" });

Order.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Customer.hasMany(Order, { foreignKey: "customerId", as: "orders" });

Order.belongsTo(LocalPartner, { foreignKey: "localPartnerId", as: "partner" });
LocalPartner.hasMany(Order, { foreignKey: "localPartnerId", as: "orders" });

Invoice.hasMany(InvoiceItem, { foreignKey: "invoiceId", as: "items" });
InvoiceItem.belongsTo(Invoice, { foreignKey: "invoiceId" });

Customer.belongsTo(LocalPartner, { foreignKey: "localPartnerId", as: "localPartner" });
LocalPartner.hasMany(Customer, { foreignKey: "localPartnerId", as: "customers" });

LocalPartner.hasMany(PartnerProduct, { foreignKey: "partnerId", as: "partnerProducts" });
PartnerProduct.belongsTo(LocalPartner, { foreignKey: "partnerId" });
PartnerProduct.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(PartnerProduct, { foreignKey: "productId", as: "partnerProducts" });

Order.hasOne(OrderProfit, { foreignKey: "orderId", as: "profit" });
OrderProfit.belongsTo(Order, { foreignKey: "orderId" });
OrderProfit.belongsTo(LocalPartner, { foreignKey: "partnerId", as: "partner" });

module.exports = {
    Order, OrderItem, Product, Admin, OrderTracking,
    Customer, LocalPartner, Invoice, InvoiceItem,
    PartnerProduct, OrderProfit
};