
const { Order, OrderItem, Product, OrderTracking, Customer } = require("../models/index");
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
    const { paymentMethod, orderFrequency, note, purchaseOrderNumber, items } = req.body;
    const customer = req.customer;

    if (!customer) return errorResponse({ res, message: "Customer not authenticated", status: 401 });
    if (!paymentMethod || !orderFrequency) return errorResponse({
        res, message: "paymentMethod and orderFrequency are required", status: 400
    });
    if (!Array.isArray(items) || items.length === 0) return errorResponse({
        res, message: "At least one item is required", status: 400
    });

    let subtotal = 0;

    const itemsData = await Promise.all(
        items.map(async (item) => {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                throw { statusCode: 400, message: "Each item must have a productId and positive quantity" };
            }
            const product = await Product.findByPk(item.productId);
            if (!product) throw { statusCode: 404, message: `Product ${item.productId} not found` };
            subtotal += parseFloat(product.price) * item.quantity;
            return { product, quantity: item.quantity };
        })
    );

    const shippingCharges = parseFloat((subtotal * SHIPPING_RATE).toFixed(2));
    const total = parseFloat((subtotal + shippingCharges).toFixed(2));

    const order = await Order.create({
        customerId: customer.id,
        paymentMethod,
        orderFrequency,
        noteForSupplier: note || null,
        purchaseOrderNumber: purchaseOrderNumber || null,
        subtotal,
        shippingCharges,
        total,
    });

    await Promise.all(
        itemsData.map(({ product, quantity }) =>
            OrderItem.create({
                orderId: order.id,
                productId: product.id,
                quantity,
                price: product.price,
            })
        )
    );

    return successResponse({
        res,
        message: "Order created successfully",
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
        ]
    });

    if (!order) return errorResponse({ res, message: "Order not found", status: 404 });

    const customer = order.customer;

    const detail = {
        orderNumber: order.id,
        orderedOn: order.createdAt,
        companyName: customer?.companyName || null,
        email: customer?.email || null,
        address: `${customer?.addressLine1 || ""}, ${customer?.city || ""}, ${customer?.state || ""}`,
        paymentMethod: order.paymentMethod,
        orderFrequency: order.orderFrequency,
        currentStatus: order.currentStatus,
        note: order.noteForSupplier || null,
        purchaseOrderNumber: order.purchaseOrderNumber || null,
        subtotal: `$${parseFloat(order.subtotal).toFixed(2)}`,
        shippingCharges: `$${parseFloat(order.shippingCharges).toFixed(2)}`,
        total: `$${parseFloat(order.total).toFixed(2)}`,


        deliverTo: {
            address: customer?.addressLine1 || null,
            addressLine2: customer?.addressLine2 || null,
            city: customer?.city || null,
            state: customer?.state || null,
            zipCode: customer?.zipCode || null,
            country: customer?.country || null,
            phone: `${customer?.phoneCode || ""} ${customer?.phone || ""}`,
            email: customer?.email || null,
        },


        invoiceTo: {
            companyName: customer?.companyName || null,
            address: customer?.billingSameAsShipping
                ? customer?.addressLine1
                : customer?.billingAddress || null,

            city: customer?.billingSameAsShipping
                ? customer?.city
                : customer?.billingCity || null,

            state: customer?.billingSameAsShipping
                ? customer?.state
                : customer?.billingState || null,

            zipCode: customer?.billingSameAsShipping
                ? customer?.zipCode
                : customer?.billingzipCode || null,

            country: customer?.billingSameAsShipping
                ? customer?.country
                : customer?.billingCountry || null,

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
    await OrderItem.destroy({ where: { orderId: order.id } });
    await order.destroy();
    return successResponse({ res, data: null, message: "Order deleted successfully", status: 200 });
});

module.exports = { createOrder, getAllOrders, getOrder, getOrderDetail, deleteOrder };