
const { Order, OrderItem, Product } = require("../models/index");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");

const SHIPPING_RATE = 0.002;

const createOrder = asyncWrapper(async (req, res) => {
    const { companyName, email, address, paymentMethod, orderFrequency, noteForSupplier,
        purchaseOrderNumber, items } = req.body;

    if (!items || items.length === 0) {
        return errorResponse({ res, message: "At least one product is required", status: 400 });
    }

    let subtotal = 0;
    let itemsData = await Promise.all(
        items.map(async (item) => {
            const product = await Product.findByPk(item.productId);
            if (!product) throw new Error(`Product with ${item.productId} not found`);
            subtotal += parseFloat(product.price) * item.quantity;
            return { product, quantity: item.quantity }
        })
    )

    const shippingCharges = parseFloat((subtotal * SHIPPING_RATE).toFixed(2));
    const total = parseFloat((subtotal + shippingCharges).toFixed(2));

    const order = await Order.create({
        companyName,
        email,
        address,
        paymentMethod,
        orderFrequency,
        noteForSupplier: noteForSupplier || null,
        purchaseOrderNumber: purchaseOrderNumber || null,
        subtotal,
        shippingCharges,
        total,
    });

    await Promise.all(
        itemsData.map(({ product, quantity }) => {
            OrderItem.create({
                orderId: order.id,
                productId: product.id,
                quantity,
                price: product.price
            })
        })
    )

    return successResponse({
        res,
        data: {
            order,
            summary: {
                subtotal: `$${subtotal.toFixed(2)}`,
                shippingCharges: `$${shippingCharges.toFixed(2)}`,
                total: `$${total.toFixed(2)}`
            }
        },
        status: 201,
    })
})


const getAllOrders = asyncWrapper(async (req, res) => {
    const orders = await Order.findAll({
        include: [{
            model: OrderItem,
            as: "items",
            include: [{
                model: Product, as: "product"
            }]
        }],
        order: [["createdAt", "DESC"]]
    })

    return successResponse({
        res,
        data: orders,
        message: "Orders fetched successfully",
        status: 200
    })
})

const getOrder = asyncWrapper(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
        include: [{
            model: OrderItem,
            as: "items",
            include: [{ model: Product, as: "product" }]
        }]
    })

    if (!order) return errorResponse({ res, message: "Order not found", status: 404 });

    return successResponse({
        res,
        data: order,
        message: "Order fetched successfuly",
        status: 201
    })
})

const deleteOrder = asyncWrapper(async (req, res) => {
    const order = await Order.findByPk(req.params.id);
    if (!order) return errorResponse({ res, message: "Order not found", status: 404 });

    await OrderItem.destroy({ where: { orderId: order.id } });
    await order.destroy();

    return successResponse({ res, data: order, message: "Order deleted", status: 200 });
})

module.exports = {
    createOrder,
    getAllOrders,
    getOrder,
    deleteOrder
}