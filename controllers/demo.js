
const { sequelize } = require("../config/db");
const { Order, OrderItem, Product, OrderTracking, Customer } = require("../models/index");
const LocalPartner = require("../models/LocalPartner");
const PartnerProduct = require("../models/PartnerProduct");
const OrderProfit = require("../models/OrderProfit");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");

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
    const {
        paymentMethod, orderFrequency, note, purchaseOrderNumber, items,
        isLocalPartner, localPartnerId,
        isAdminPartnerOrder, customerId
    } = req.body;
    const customer = req.customer;

    if (!paymentMethod || !orderFrequency) return errorResponse({
        res, message: "paymentMethod and orderFrequency are required", status: 400
    });
    if (!Array.isArray(items) || items.length === 0) return errorResponse({
        res, message: "At least one item is required", status: 400
    });

    let subtotal = 0;
    let wholeSaleTotal = 0;

    // ─── Admin Partner Order ──────────────────
    if (isAdminPartnerOrder === true || isAdminPartnerOrder === "true") {
        if (!localPartnerId) return errorResponse({ res, message: "localPartnerId is required", status: 400 });
        if (!customerId) return errorResponse({ res, message: "customerId is required", status: 400 });

        const partner = await LocalPartner.findByPk(localPartnerId);
        if (!partner) return errorResponse({ res, message: "Partner not found", status: 404 });

        const selectedCustomer = await Customer.findOne({
            where: { id: customerId, localPartnerId: partner.id }
        });
        if (!selectedCustomer) return errorResponse({
            res, message: "Customer does not belong to this partner", status: 403
        });

        // for...of loop
        const itemsData = [];
        for (const item of items) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                return errorResponse({ res, message: "Each item must have a productId and positive quantity", status: 400 });
            }

            const partnerProduct = await PartnerProduct.findOne({
                where: { partnerId: localPartnerId, productId: item.productId }
            });
            if (!partnerProduct) return errorResponse({ res, message: `Product ${item.productId} not assigned to this partner`, status: 400 });

            const product = await Product.findByPk(item.productId);
            if (!product) return errorResponse({ res, message: `Product ${item.productId} not found`, status: 404 });

            const sellingPrice = partnerProduct.sellingPrice
                ? parseFloat(partnerProduct.sellingPrice)
                : parseFloat(product.price);

            const wsPrice = partnerProduct.wholesalePrice
                ? parseFloat(partnerProduct.wholesalePrice)
                : parseFloat(product.wholeSalePrice);

            subtotal += sellingPrice * item.quantity;
            wholeSaleTotal += wsPrice * item.quantity;

            itemsData.push({ product, quantity: item.quantity, sellingPrice, wsPrice });
        }

        const shippingCharges = parseFloat((subtotal * SHIPPING_RATE).toFixed(2));
        const total = parseFloat((subtotal + shippingCharges).toFixed(2));
        const adminReceives = parseFloat((wholeSaleTotal + shippingCharges).toFixed(2));
        const partnerProfit = parseFloat((total - adminReceives).toFixed(2));

        const { order } = await sequelize.transaction(async (t) => {
            const order = await Order.create({
                customerId: selectedCustomer.id,
                localPartnerId: partner.id,
                isLocalPartner: true,
                paymentMethod, orderFrequency,
                noteForSupplier: note || null,
                purchaseOrderNumber: purchaseOrderNumber || null,
                subtotal, shippingCharges, total,
            }, { transaction: t });

            for (const { product, quantity, sellingPrice } of itemsData) {
                await OrderItem.create({
                    orderId: order.id,
                    productId: product.id,
                    quantity,
                    price: sellingPrice,
                }, { transaction: t });
            }

            await OrderProfit.create({
                orderId: order.id,
                partnerId: partner.id,
                orderTotal: total,
                wholeSaleTotal,
                shippingCharges,
                adminReceives,
                partnerProfit,
            }, { transaction: t });

            return { order };
        });

        return successResponse({
            res, message: "Partner order created successfully",
            data: {
                order: {
                    ...order.toJSON(),
                    partner: { name: partner.name, email: partner.email },
                    customer: {
                        companyName: selectedCustomer.companyName,
                        email: selectedCustomer.email,
                    },
                },
                summary: {
                    wholeSalePrice: `$${wholeSaleTotal.toFixed(2)}`,
                    subtotal: `$${subtotal.toFixed(2)}`,
                    shippingCharges: `$${shippingCharges.toFixed(2)}`,
                    total: `$${total.toFixed(2)}`,
                },
                profitBreakdown: {
                    orderTotal: `$${total.toFixed(2)}`,
                    adminReceives: `$${adminReceives.toFixed(2)}`,
                    partnerProfit: `$${partnerProfit.toFixed(2)}`,
                },
            },
            status: 201,
        });

    // ─── Local Partner (customer app) ─────────
    } else if (isLocalPartner === true || isLocalPartner === "true") {
        if (!localPartnerId) return errorResponse({ res, message: "Local Partner Id is required", status: 400 });

        const partner = await LocalPartner.findByPk(localPartnerId);
        if (!partner) return errorResponse({ res, message: "Partner not found", status: 404 });

        const itemsData = [];
        for (const item of items) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                return errorResponse({ res, message: "Each item must have a productId and positive quantity", status: 400 });
            }
            const product = await Product.findByPk(item.productId);
            if (!product) return errorResponse({ res, message: `Product ${item.productId} not found`, status: 404 });
            subtotal += parseFloat(product.wholeSalePrice) * item.quantity;
            itemsData.push({ product, quantity: item.quantity });
        }

        const shippingCharges = parseFloat((subtotal * SHIPPING_RATE).toFixed(2));
        const total = parseFloat((subtotal + shippingCharges).toFixed(2));

        const order = await sequelize.transaction(async (t) => {
            const order = await Order.create({
                customerId: null,
                localPartnerId: partner.id,
                isLocalPartner: true,
                paymentMethod, orderFrequency,
                noteForSupplier: note || null,
                purchaseOrderNumber: purchaseOrderNumber || null,
                subtotal, shippingCharges, total,
            }, { transaction: t });

            for (const { product, quantity } of itemsData) {
                await OrderItem.create({
                    orderId: order.id,
                    productId: product.id,
                    quantity,
                    price: product.wholeSalePrice,
                }, { transaction: t });
            }

            return order;
        });

        return successResponse({
            res, message: "Order created successfully",
            data: {
                order: {
                    ...order.toJSON(),
                    partner: { name: partner.name, email: partner.email },
                },
                summary: {
                    subtotal: `$${subtotal.toFixed(2)}`,
                    shippingCharges: `$${shippingCharges.toFixed(2)}`,
                    total: `$${total.toFixed(2)}`,
                },
            },
            status: 201,
        });

    // ─── Normal Customer Order ────────────────
    } else {
        if (!customer) return errorResponse({ res, message: "Customer not found", status: 401 });

        const itemsData = [];
        for (const item of items) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                return errorResponse({ res, message: "Each item must have a productId and positive quantity", status: 400 });
            }
            const product = await Product.findByPk(item.productId);
            if (!product) return errorResponse({ res, message: `Product ${item.productId} not found`, status: 404 });
            subtotal += parseFloat(product.price) * item.quantity;
            itemsData.push({ product, quantity: item.quantity });
        }

        const shippingCharges = parseFloat((subtotal * SHIPPING_RATE).toFixed(2));
        const total = parseFloat((subtotal + shippingCharges).toFixed(2));

        const order = await sequelize.transaction(async (t) => {
            const order = await Order.create({
                customerId: customer.id,
                localPartnerId: null,
                isLocalPartner: false,
                paymentMethod, orderFrequency,
                noteForSupplier: note || null,
                purchaseOrderNumber: purchaseOrderNumber || null,
                subtotal, shippingCharges, total,
            }, { transaction: t });

            for (const { product, quantity } of itemsData) {
                await OrderItem.create({
                    orderId: order.id,
                    productId: product.id,
                    quantity,
                    price: product.price,
                }, { transaction: t });
            }

            return order;
        });

        return successResponse({
            res, message: "Order created successfully",
            data: {
                order: {
                    ...order.toJSON(),
                    customer: {
                        companyName: customer.companyName,
                        email: customer.email,
                        address: `${customer.addressLine1 || ""}, ${customer.city || ""}, ${customer.state || ""}`,
                    },
                },
                summary: {
                    subtotal: `$${subtotal.toFixed(2)}`,
                    shippingCharges: `$${shippingCharges.toFixed(2)}`,
                    total: `$${total.toFixed(2)}`,
                },
            },
            status: 201,
        });
    }
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
        LocalPartnerName: partner ? partner.name : null,
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