
const { sequelize } = require("../config/db");
const { Order, OrderItem, Product, OrderTracking, Customer } = require("../models/index");
const LocalPartner = require("../models/LocalPartner");
const PartnerProduct = require("../models/PartnerProduct");
const OrderProfit = require("../models/OrderProfit");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");
const { Op } = require("sequelize");

const SHIPPING_RATE = 0.2;

const formatLabel = (status) => {
    const labels = {
        order_placed: "Order Placed",
        dispatched_to_supplier: "Dispatched to Supplier",
        supplier_acknowledged: "Supplier Acknowledged",
        shipped: "Shipped",
    };
    return labels[status] || status;
};

const createOrder = asyncWrapper(async (req, res) => {
    const { orderObj, items } = req.body;
    const customer = req.customer;

    if (!orderObj || !items || items.length === 0) {
        return errorResponse({ res, message: "orderObj and items are required", status: 400 });
    }

    const { paymentMethod, orderFrequency, note, purchaseOrderNumber, localPartnerId, customerId, isAdminPartnerOrder } = orderObj;

    if (!paymentMethod || !orderFrequency) {
        return errorResponse({ res, message: "paymentMethod and orderFrequency are required", status: 400 });
    }

    for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
            return errorResponse({ res, message: "Each item must have a productId and positive quantity", status: 400 });
        }
    }

    const isAdminOrder = isAdminPartnerOrder === true;
    const prodIds = items.map(item => item.productId);

    const Model = isAdminOrder ? PartnerProduct : Product;
    const productCondition = isAdminOrder
        ? { productId: { [Op.in]: prodIds }, partnerId: localPartnerId }
        : { id: { [Op.in]: prodIds } };

    const products = await Model.findAll({
        where: productCondition
    });


    if (products.length !== prodIds.length) {
        return errorResponse({ res, message: "One or more products not found or not assigned to this partner", status: 404 });
    }

    let subtotal = 0;
    let wholeSaleTotal = 0;
    const itemsData = [];

    for (const item of items) {
        const found = isAdminOrder
            ? products.find(p => p.productId === item.productId)
            : products.find(p => p.id === item.productId);

        const sellingPrice = isAdminOrder
            ?  parseFloat(found.sellingPrice || 0)
            : parseFloat(found.price || 0);

        const wsPrice = isAdminOrder
            ?  parseFloat(found.wholesalePrice || 0)
            : parseFloat(found.wholeSalePrice || 0);

        subtotal += sellingPrice * item.quantity;
        if (isAdminOrder) wholeSaleTotal += wsPrice * item.quantity;

        itemsData.push({
            productId:found.productId || found?.id,
            quantity: item.quantity,
            sellingPrice,
        });
    }

    const shippingCharges = parseFloat((subtotal * SHIPPING_RATE).toFixed(2));
    const total = parseFloat((subtotal + shippingCharges).toFixed(2));

    let partner = null;
    let selectedCustomer = customer;

    if (isAdminOrder) {
        if (!localPartnerId) return errorResponse({ res, message: "localPartnerId is required", status: 400 });
        if (!customerId) return errorResponse({ res, message: "customerId is required", status: 400 });

        partner = await LocalPartner.findByPk(localPartnerId);
        if (!partner) return errorResponse({ res, message: "Partner not found", status: 404 });

        selectedCustomer = await Customer.findOne({ where: { id: customerId, localPartnerId: partner.id } });
        if (!selectedCustomer) return errorResponse({ res, message: "Customer does not belong to this partner", status: 403 });
    } else if (customer.localPartnerId) {
        partner = await LocalPartner.findByPk(customer.localPartnerId);
    }

    const adminReceives = isAdminOrder ? parseFloat((wholeSaleTotal + shippingCharges).toFixed(2)) : null;
    const partnerProfit = isAdminOrder ? parseFloat((total - adminReceives).toFixed(2)) : null;

    const { order } = await sequelize.transaction(async (t) => {
        const order = await Order.create({
            customerId: selectedCustomer?.id || null,
            localPartnerId: partner?.id || null,
            isLocalPartner: !!partner,
            paymentMethod, orderFrequency,
            noteForSupplier: note || null,
            purchaseOrderNumber: purchaseOrderNumber || null,
            subtotal, shippingCharges, total,
        }, { transaction: t });

        for (const {  productId,quantity, sellingPrice } of itemsData) {
            await OrderItem.create({
                orderId: order.id,
                productId: productId,
                quantity,
                unitPrice: sellingPrice,
                total: sellingPrice * quantity
            }, { transaction: t });
        }

        if (isAdminOrder && partner) {
            await OrderProfit.create({
                orderId: order.id,
                partnerId: partner.id,
                orderTotal: total,
                wholeSaleTotal,
                shippingCharges,
                adminReceives,
                partnerProfit,
            }, { transaction: t });
        }

        await OrderTracking.create({
            orderId: order.id,
            status: "order_placed",
            timestamp: new Date(),
        }, { transaction: t });

        return { order };
    });

    return successResponse({
        res, message: "Order created successfully",
        data: {
            order: {
                ...order.toJSON(),
                ...(partner && { partner: { name: partner.name, email: partner.email } }),
                customer: {
                    companyName: selectedCustomer?.companyName,
                    email: selectedCustomer?.email,
                    address: `${selectedCustomer?.addressLine1 || ""}, ${selectedCustomer?.city || ""}, ${selectedCustomer?.state || ""}`,
                },
            },
            summary: {
                subtotal: `$${subtotal.toFixed(2)}`,
                shippingCharges: `$${shippingCharges.toFixed(2)}`,
                total: `$${total.toFixed(2)}`,
                ...(isAdminOrder && { wholeSaleTotal: `$${wholeSaleTotal.toFixed(2)}` }),
            },
            ...(isAdminOrder && partner && {
                profitBreakdown: {
                    orderTotal: `$${total.toFixed(2)}`,
                    adminReceives: `$${adminReceives.toFixed(2)}`,
                    partnerProfit: `$${partnerProfit.toFixed(2)}`,
                }
            }),
        },
        status: 201,
    });
});

const getAllOrders = asyncWrapper(async (req, res) => {
    const orders = await Order.findAll({
        include: [{ model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }],
        order: [["createdAt", "DESC"]],
    });
    return successResponse({ res, data: orders, message: "Orders fetched successfully", status: 200 });
});

const getOrder = asyncWrapper(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
        include: [{ model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }],
    });
    if (!order) return errorResponse({ res, message: "Order not found", status: 404 });
    return successResponse({ res, data: order, message: "Order fetched successfully", status: 200 });
});

const getOrderDetail = asyncWrapper(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
        include: [
            { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] },
            { model: OrderTracking, as: "tracking" },
            { model: Customer, as: "customer" },
            { model: LocalPartner, as: "partner" },
            { model: OrderProfit, as: "profit" },
        ]
    });

    if (!order) return errorResponse({ res, message: "Order not found", status: 404 });

    const customer = order.customer;
    const partner = order.partner;

    const detail = {
        orderNumber: order.id,
        orderedOn: order.createdAt,
        isLocalPartner: order.isLocalPartner,
        companyName: customer?.companyName || null,
        localPartnerName: partner?.name || null,
        email: order.isLocalPartner ? partner?.email : customer?.email || null,
        address: order.isLocalPartner
            ? `${partner?.shippingAddressLine1 || ""}, ${partner?.shippingCity || ""}, ${partner?.shippingState || ""}`
            : `${customer?.addressLine1 || ""}, ${customer?.city || ""}, ${customer?.state || ""}`,
        paymentMethod: order.paymentMethod,
        orderFrequency: order.orderFrequency,
        currentStatus: order.currentStatus,
        note: order.noteForSupplier || null,
        purchaseOrderNumber: order.purchaseOrderNumber || null,
        subtotal: `$${parseFloat(order.subtotal).toFixed(2)}`,
        shippingCharges: `$${parseFloat(order.shippingCharges).toFixed(2)}`,
        total: `$${parseFloat(order.total).toFixed(2)}`,
        profitBreakdown: order.profit ? {
            orderTotal: `$${parseFloat(order.profit.orderTotal).toFixed(2)}`,
            adminReceives: `$${parseFloat(order.profit.adminReceives).toFixed(2)}`,
            partnerProfit: `$${parseFloat(order.profit.partnerProfit).toFixed(2)}`,
        } : null,
        deliverTo: order.isLocalPartner ? {
            address: partner?.shippingAddressLine1 || null,
            addressLine2: partner?.shippingAddressLine2 || null,
            city: partner?.shippingCity || null,
            state: partner?.shippingState || null,
            zipCode: partner?.shippingZipCode || null,
            country: partner?.shippingCountry || null,
            phone: partner?.phone || null,
            email: partner?.email || null,
        } : {
            address: customer?.addressLine1 || null,
            addressLine2: customer?.addressLine2 || null,
            city: customer?.city || null,
            state: customer?.state || null,
            zipCode: customer?.zipCode || null,
            country: customer?.country || null,
            phone: `${customer?.phoneCode || ""} ${customer?.phone || ""}`,
            email: customer?.email || null,
        },
        invoiceTo: order.isLocalPartner ? {
            companyName: partner?.name || null,
            address: partner?.billingSameAsShipping ? partner?.shippingAddressLine1 : partner?.billingAddressLine1 || null,
            city: partner?.billingSameAsShipping ? partner?.shippingCity : partner?.billingCity || null,
            state: partner?.billingSameAsShipping ? partner?.shippingState : partner?.billingState || null,
            zipCode: partner?.billingSameAsShipping ? partner?.shippingZipCode : partner?.billingZipCode || null,
            country: partner?.billingSameAsShipping ? partner?.shippingCountry : partner?.billingCountry || null,
            phone: partner?.phone || null,
            email: partner?.email || null,
        } : {
            companyName: customer?.companyName || null,
            address: customer?.billingSameAsShipping ? customer?.addressLine1 : customer?.billingAddress || null,
            city: customer?.billingSameAsShipping ? customer?.city : customer?.billingCity || null,
            state: customer?.billingSameAsShipping ? customer?.state : customer?.billingState || null,
            zipCode: customer?.billingSameAsShipping ? customer?.zipCode : customer?.billingZipCode || null,
            country: customer?.billingSameAsShipping ? customer?.country : customer?.billingCountry || null,
            phone: `${customer?.phoneCode || ""} ${customer?.phone || ""}`,
            email: customer?.email || null,
        },
        items: order.items.map((item) => ({
            code: item.product?.productCode || null,
            sku: item.product?.sku || null,
            name: item.product?.name || null,
            grind: item.product?.grind || null,
            quantity: item.quantity,
            unitPrice: `$${parseFloat(item.price).toFixed(2)}`,
            total: `$${(parseFloat(item.price) * item.quantity).toFixed(2)}`,
        })),
        tracking: order.tracking
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .map((t) => ({
                status: t.status,
                label: formatLabel(t.status),
                timestamp: t.timestamp,
            })),
    };

    return successResponse({ res, data: detail, message: "Order detail fetched", status: 200 });
});

const deleteOrder = asyncWrapper(async (req, res) => {
    const order = await Order.findByPk(req.params.id);
    if (!order) return errorResponse({ res, message: "Order not found", status: 404 });
    await OrderProfit.destroy({ where: { orderId: order.id } });
    await OrderItem.destroy({ where: { orderId: order.id } });
    await OrderTracking.destroy({ where: { orderId: order.id } });
    await order.destroy();
    return successResponse({ res, data: null, message: "Order deleted successfully", status: 200 });
});

module.exports = { createOrder, getAllOrders, getOrder, getOrderDetail, deleteOrder };