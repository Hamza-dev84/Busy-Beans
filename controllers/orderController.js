
const { Order, OrderItem, Product } = require("../models/index");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");

const SHIPPING_RATE = 0.2;

const createOrder = asyncWrapper(async (req, res) => {
    const { paymentMethod, orderFrequency, note, purchaseOrderNumber, items } = req.body;
    const customer = req.customer;

    if (!customer) return errorResponse({ res, message: "Customer not authenticated", status: 401 });
    if (!paymentMethod || !orderFrequency) return errorResponse({ res, message: "paymentMethod and orderFrequency are required", status: 400 });
    if (!Array.isArray(items) || items.length === 0) return errorResponse({ res, message: "At least one item is required", status: 400 });

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

const deleteOrder = asyncWrapper(async (req, res) => {
    const order = await Order.findByPk(req.params.id);
    if (!order) return errorResponse({ res, message: "Order not found", status: 404 });

    await OrderItem.destroy({ where: { orderId: order.id } });
    await order.destroy();

    return successResponse({ res, data: null, message: "Order deleted successfully", status: 200 });
});

module.exports = { createOrder, getAllOrders, getOrder, deleteOrder };