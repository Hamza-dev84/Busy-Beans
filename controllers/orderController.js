
const { sequelize } = require("../config/db");
const { Order, OrderItem, Product, OrderTracking, Customer } = require("../models/index");
const LocalPartner = require("../models/LocalPartner");
const OrderProfit = require("../models/OrderProfit");
const Supplier = require("../models/Supplier");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");
const { Op } = require("sequelize");
const {
    fetchProducts,
    calculateTotals,
    fetchPartner,
    fetchSelectedCustomer,
    createOrderRecord,
    createOrderItems,
    createOrderProfit,
    createOrderTracking,
} = require("../services/orderService");

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

    const { paymentMethod, orderFrequency, localPartnerId, customerId, isAdminPartnerOrder, isLocalPartner } = orderObj;

    if (!paymentMethod || !orderFrequency) {
        return errorResponse({ res, message: "paymentMethod and orderFrequency are required", status: 400 });
    }

    for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
            return errorResponse({ res, message: "Each item must have a productId and positive quantity", status: 400 });
        }
    }

    const isAdminOrder = isAdminPartnerOrder === true;
    const isPartnerOrder = isLocalPartner === true;
    const prodIds = items.map(item => item.productId);

    const products = await fetchProducts(isAdminOrder, prodIds, localPartnerId);
    if (products.length !== prodIds.length) {
        return errorResponse({ res, message: "One or more products not found or not assigned to this partner", status: 404 });
    }

    const totals = calculateTotals(isAdminOrder, isPartnerOrder, items, products);

    if (isAdminOrder) {
        if (!localPartnerId) return errorResponse({ res, message: "localPartnerId is required", status: 400 });
        if (!customerId) return errorResponse({ res, message: "customerId is required", status: 400 });
    }

    if (isPartnerOrder && !localPartnerId) {
        return errorResponse({ res, message: "localPartnerId is required", status: 400 });
    }

    const partner = (isAdminOrder || isPartnerOrder)
        ? await fetchPartner(true, localPartnerId, customer)
        : null;

    if ((isAdminOrder || isPartnerOrder) && !partner) {
        return errorResponse({ res, message: "Partner not found", status: 404 });
    }

    const selectedCustomer = await fetchSelectedCustomer(isAdminOrder, customerId, partner?.id, customer);
    if (isAdminOrder && !selectedCustomer) return errorResponse({ res, message: "Customer does not belong to this partner", status: 403 });

    const { order } = await sequelize.transaction(async (t) => {
        const order = await createOrderRecord(selectedCustomer, partner, orderObj, totals, isAdminOrder, isPartnerOrder, t);
        await createOrderItems(order.id, totals.itemsData, t);
        if (isAdminOrder && partner) await createOrderProfit(order.id, partner, totals, t);
        await createOrderTracking(order.id, t);
        return { order };
    });

    return successResponse({
        res, message: "Order created successfully",
        data: {
            order: {
                ...order.toJSON(),
                ...(partner && { partner: { name: partner.name, email: partner.email } }),
                ...(!isPartnerOrder && selectedCustomer && {
                    customer: {
                        companyName: selectedCustomer.companyName,
                        email: selectedCustomer.email,
                        address: `${selectedCustomer.addressLine1 || ""}, ${selectedCustomer.city || ""}, ${selectedCustomer.state || ""}`,
                    },
                }),
            },
            summary: {
                subtotal: `$${totals.subtotal.toFixed(2)}`,
                shippingCharges: `$${totals.shippingCharges.toFixed(2)}`,
                total: `$${totals.total.toFixed(2)}`,
                ...(isAdminOrder && { wholeSaleTotal: `$${totals.wholeSaleTotal.toFixed(2)}` }),
            },
            ...(isAdminOrder && partner && {
                profitBreakdown: {
                    orderTotal: `$${totals.total.toFixed(2)}`,
                    adminReceives: `$${totals.adminReceives.toFixed(2)}`,
                    partnerProfit: `$${totals.partnerProfit.toFixed(2)}`,
                }
            }),
        },
        status: 201,
    });
});

const getAllOrders = asyncWrapper(async (req, res) => {
    const { customerId, supplierId, localPartnerId, currentStatus, status, isLocalPartner,
        paymentMethod, orderFrequency } = req.query;
    let filter = {};
    if (currentStatus) {
        const validCurrentStatuses = [
            "order_placed",
            "dispatched_to_supplier",
            "supplier_acknowledged",
            "shipped",
            "cancelled"
        ]

        const normalized = currentStatus.toLowerCase();
        if (!validCurrentStatuses.includes(normalized)) {
            return errorResponse({ res, message: "Invalid currentStatus", status: 401 });
        }
        filter.currentStatus = normalized;
    }

    if (status) {
        const validStatuses = ["pending", "completed", "cancelled"];
        const normalized = status.toLowerCase();
        if (!validStatuses.includes(normalized)) {
            return errorResponse({ res, message: "Invalid status", status: 400 });
        }
        filter.status = normalized;
    }

    if (customerId) filter.customerId = customerId;
    if (supplierId) filter.supplierId = supplierId;
    if (localPartnerId) filter.localPartnerId = localPartnerId;

    if (isLocalPartner !== undefined) {
        filter.isLocalPartner = isLocalPartner === "true";
    }

    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (orderFrequency) filter.orderFrequency = orderFrequency;

    const orders = await Order.findAll({
        where: filter,
        include: [
            { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }
        ]
    })

    return successResponse({ res, data: orders, message: "Orders fetched successfuly", status: 200 });
})

const getOrder = asyncWrapper(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
        include: [{ model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }],
    });
    if (!order) return errorResponse({ res, message: "Order not found", status: 404 });
    return successResponse({ res, data: order, message: "Order fetched successfully", status: 200 });
});

const getPartnerOrders = asyncWrapper(async (req, res) => {
    const { supplierId, localPartnerId, currentStatus, status,
        paymentMethod, orderFrequency } = req.query;
    let filter = {
        isLocalPartner: true,
        customerId: null
    };
    if (currentStatus) {
        const validCurrentStatuses = [
            "order_placed",
            "dispatched_to_supplier",
            "supplier_acknowledged",
            "shipped",
            "cancelled"
        ]
        const normalized = currentStatus.toLowerCase();
        if (!validCurrentStatuses.includes(normalized)) {
            return errorResponse({ res, message: "Invalid current status", status: 400 });
        }
        filter.currentStatus = normalized;
    }

    if (status) {
        const validStatuses = ["pending", "completed", "cancelled"];
        const normalized = status.toLowerCase(status);
        if (!validStatuses.includes(normalized)) {
            return errorResponse({ res, message: "Invalid status", status: 400 });
        }
    }
    if (supplierId) filter.supplierId = supplierId;
    if (localPartnerId) filter.localPartnerId = localPartnerId;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (orderFrequency) filter.orderFrequency = orderFrequency;

    const orders = await Order.findAll({
        where: filter,
        include: [{
            model: OrderItem, as: "items", include: [{ model: Product, as: "product" }],
        }]
    })

    return successResponse({
        res, data: orders, message: "Partner Orders fetched successfuly", status: 200
    })

})

const getPartnerOrderDetail = asyncWrapper(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
        include: [
            { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] },
            { model: OrderTracking, as: "tracking" },
            { model: LocalPartner, as: "partner" },
            { model: Supplier, as: "supplier" }
        ]
    })

    return successResponse({ res, data: order, message: "Partner order detail fetched", status: 200 })
})

const getPartnerOrdersByStatus = asyncWrapper(async (req, res) => {
    const { status } = req.query;

    const validStatuses = ["order_placed", "dispatched_to_supplier", "supplier_acknowledged", "shipped"];

    if (!status) return errorResponse({ res, message: "Status is required", status: 400 });
    if (!validStatuses.includes(status)) {
        return errorResponse({ res, message: `Invalid status. Valid values: ${validStatuses.join(", ")}`, status: 400 });
    }

    const orders = await Order.findAll({
        where: {
            currentStatus: status,
            isLocalPartner: true,
            customerId: null
        },
        include: [{ model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }],
        order: [["createdAt", "DESC"]],
    });

    return successResponse({ res, data: orders, message: "Orders fetched successfully", status: 200 });
});

const getOrderDetail = asyncWrapper(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
        include: [
            { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] },
            { model: OrderTracking, as: "tracking" },
            { model: Customer, as: "customer" },
            { model: LocalPartner, as: "partner" },
            { model: OrderProfit, as: "profit" },
            { model: Supplier, as: "supplier" }
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
            unitPrice: `$${parseFloat(item.unitPrice).toFixed(2)}`,
            total: `$${parseFloat(item.total).toFixed(2)}`,
        })),
        tracking: order.tracking
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .map((t) => ({
                status: t.status,
                label: formatLabel(t.status),
                timestamp: t.timestamp,
            })),

        supplier: order.supplier ? {
            id: order.supplier.id,
            name: order.supplier.name,
            email: order.supplier.email,
            phone: order.supplier.phone
        } : null,
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

module.exports = {
    createOrder,
    getAllOrders,
    getOrder,
    getOrderDetail,
    deleteOrder,
    getPartnerOrders,
    getPartnerOrderDetail,
    getPartnerOrdersByStatus,
};