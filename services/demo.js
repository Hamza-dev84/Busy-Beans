


const { Op } = require("sequelize");
const { Order, OrderItem, OrderProfit, OrderTracking, Customer, Product } = require("../models/index");
const LocalPartner = require("../models/LocalPartner");
const PartnerProduct = require("../models/PartnerProduct");

const SHIPPING_RATE = 0.2;

const fetchProducts = (isAdminOrder, prodIds, localPartnerId) => {
    const Model = isAdminOrder ? PartnerProduct : Product;
    const condition = isAdminOrder
        ? { productId: { [Op.in]: prodIds }, partnerId: localPartnerId }
        : { id: { [Op.in]: prodIds } };
    return Model.findAll({ where: condition });
};

const calculateTotals = (isAdminOrder, items, products) => {
    let subtotal = 0;
    let wholeSaleTotal = 0;
    const itemsData = [];

    for (const item of items) {
        const found = isAdminOrder
            ? products.find(p => p.productId === item.productId)
            : products.find(p => p.id === item.productId);

        const sellingPrice = parseFloat(isAdminOrder ? found.sellingPrice || 0 : found.price || 0);
        const wsPrice = parseFloat(isAdminOrder ? found.wholesalePrice || 0 : found.wholeSalePrice || 0);

        subtotal += sellingPrice * item.quantity;
        if (isAdminOrder) wholeSaleTotal += wsPrice * item.quantity;

        itemsData.push({
            productId: found.productId || found.id,
            quantity: item.quantity,
            sellingPrice,
        });
    }

    const shippingCharges = parseFloat((subtotal * SHIPPING_RATE).toFixed(2));
    const total = parseFloat((subtotal + shippingCharges).toFixed(2));
    const adminReceives = isAdminOrder ? parseFloat((wholeSaleTotal + shippingCharges).toFixed(2)) : null;
    const partnerProfit = isAdminOrder ? parseFloat((total - adminReceives).toFixed(2)) : null;

    return { itemsData, subtotal, wholeSaleTotal, shippingCharges, total, adminReceives, partnerProfit };
};

const fetchPartner = (isAdminOrder, localPartnerId, customer) => {
    if (isAdminOrder) return LocalPartner.findByPk(localPartnerId);
    if (customer.localPartnerId) return LocalPartner.findByPk(customer.localPartnerId);
    return null;
};

const fetchSelectedCustomer = (isAdminOrder, customerId, partnerId, customer) => {
    if (isAdminOrder) return Customer.findOne({ where: { id: customerId, localPartnerId: partnerId } });
    return customer;
};

const createOrderRecord = (selectedCustomer, partner, orderObj, totals, t) =>
    Order.create({
        customerId: selectedCustomer?.id || null,
        localPartnerId: partner?.id || null,
        isLocalPartner: !!partner,
        paymentMethod: orderObj.paymentMethod,
        orderFrequency: orderObj.orderFrequency,
        noteForSupplier: orderObj.note || null,
        purchaseOrderNumber: orderObj.purchaseOrderNumber || null,
        subtotal: totals.subtotal,
        shippingCharges: totals.shippingCharges,
        total: totals.total,
    }, { transaction: t });

const createOrderItems = (orderId, itemsData, t) =>
    Promise.all(itemsData.map(({ productId, quantity, sellingPrice }) =>
        OrderItem.create({
            orderId,
            productId,
            quantity,
            unitPrice: sellingPrice,
            total: sellingPrice * quantity,
        }, { transaction: t })
    ));

const createOrderProfit = (orderId, partner, totals, t) =>
    OrderProfit.create({
        orderId,
        partnerId: partner.id,
        orderTotal: totals.total,
        wholeSaleTotal: totals.wholeSaleTotal,
        shippingCharges: totals.shippingCharges,
        adminReceives: totals.adminReceives,
        partnerProfit: totals.partnerProfit,
    }, { transaction: t });

const createOrderTracking = (orderId, t) =>
    OrderTracking.create({
        orderId,
        status: "order_placed",
        timestamp: new Date(),
    }, { transaction: t });

module.exports = {
    fetchProducts,
    calculateTotals,
    fetchPartner,
    fetchSelectedCustomer,
    createOrderRecord,
    createOrderItems,
    createOrderProfit,
    createOrderTracking,
};