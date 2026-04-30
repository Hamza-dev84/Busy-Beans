
const { sequelize } = require("../config/db");
const { Order, OrderTracking, Customer, LocalPartner } = require("../models/index");
const Supplier = require("../models/Supplier");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");
const {
  sendDispatchEmail, sendShippedEmail, sendDispatchedToCustomerEmail,
  sendOrderConfirmationEmail
} = require("../services/emailService");

const STATUS_STEPS = [
  "order_placed",
  "dispatched_to_supplier",
  "supplier_acknowledged",
  "shipped",
];

const getPakistanTime = () => {
  const now = new Date();
  const pkTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  return pkTime;
};

const formatLabel = (status) => {
  const labels = {
    order_placed: "Order Placed",
    dispatched_to_supplier: "Dispatched to Supplier",
    supplier_acknowledged: "Supplier Acknowledged",
    shipped: "Shipped",
  };
  return labels[status] || status;
};


const updateOrderStatus = asyncWrapper(async (req, res) => {
  const { status, supplierId } = req.body;

  if (!status) {
    return errorResponse({ res, message: "Status is required", status: 400 });
  }

  if (!STATUS_STEPS.includes(status)) {
    return errorResponse({
      res,
      message: `Invalid status. Valid values: ${STATUS_STEPS.join(", ")}`,
      status: 400,
    });
  }

  const order = await Order.findByPk(req.params.id);
  if (!order) return errorResponse({ res, message: "Order not found", status: 404 });

  const alreadyExists = await OrderTracking.findOne({
    where: { orderId: order.id, status },
  });
  if (alreadyExists) {
    return errorResponse({ res, message: `Status "${status}" already set`, status: 409 });
  }

  if (status === "dispatched_to_supplier") {
    if (!supplierId) return errorResponse(
      { res, message: "Supplier id is required when dispatching to supplier", status: 400 });
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) return errorResponse({ res, message: "Supplier not found", status: 400 });
    await order.update({ supplierId: supplier.id });

    try {
      await sendDispatchEmail(supplier.email, supplier.name, order)
    } catch (emailErr) {
      console.error("Email not send to supplier", emailErr.message);
    }

          try {
          const fullOrder = await Order.findByPk(order.id, {
              include: [
                  { model: Customer, as: "customer" },
                  { model: LocalPartner, as: "partner" },
              ]
          });
  
          const customer = fullOrder.customer;
          const partner = fullOrder.partner;
          const isAdminOrder = fullOrder.isLocalPartner && fullOrder.customerId;
          const isPartnerOrder = fullOrder.isLocalPartner && !fullOrder.customerId;
  
          if (!fullOrder.isLocalPartner && customer?.email) {
              await sendDispatchedToCustomerEmail(customer.dispatchEmail || customer.email, customer.userName, fullOrder);
          }
  
         
          if (isPartnerOrder && partner?.email) {
              await sendDispatchedToCustomerEmail(partner.email, partner.name, fullOrder);
          }
  
          if (isAdminOrder) {
              if (customer?.email) {
                  await sendDispatchedToCustomerEmail(customer.dispatchEmail || customer.email, customer.userName, fullOrder);
              }
              if (partner?.email) {
                  await sendDispatchedToCustomerEmail(partner.email, partner.name, fullOrder);
              }
          }
  
      } catch (emailErr) {
          console.error("Dispatch customer email failed:", emailErr.message);
      }
  }

  const { tracking } = await sequelize.transaction(async (t) => {
    const tracking = await OrderTracking.create({
      orderId: order.id,
      status,
      timestamp: getPakistanTime(),
    }, { transaction: t });

    await order.update({
      currentStatus: status,
      status: status === "shipped" ? "completed" : "pending",
    }, { transaction: t });

    return { tracking };
  })

  if (status === "shipped") {
    try {
      const fullOrder = await Order.findByPk(order.id, {
        include: [
          { model: Customer, as: "customer" },
          { model: LocalPartner, as: "partner" }
        ]
      })

      const customer = fullOrder.customer;
      const partner = fullOrder.partner;
      const isAdminOrder = fullOrder.isLocalPartner && fullOrder.customerId;
      const isPartnerOrder = fullOrder.isLocalPartner && !fullOrder.customerId;

      if (!fullOrder.isLocalPartner && customer?.email) {
        await sendShippedEmail(customer.email, customer.userName, fullOrder)
      }

      if (isPartnerOrder && partner?.email) {
        await sendShippedEmail(partner.email, partner.name, fullOrder)
      }

      if (isAdminOrder) {
        if (customer?.email) {
          await sendShippedEmail(customer.email, customer.userName, fullOrder)
        }
        if (partner?.email) {
          await sendShippedEmail(partner.email, partner.name, fullOrder)
        }
      }

    } catch (error) {
      console.warn("shipped email failed", error.message);
    }
  }

  return successResponse({
    res,
    message: "Order status updated",
    data: tracking,
    order: {
      orderId: order.id,
      currentStatus: status
    },

    status: 201
  });
});


const getOrderTracking = asyncWrapper(async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return errorResponse({ res, message: "Order not found", status: 404 });

  const trackingRecords = await OrderTracking.findAll({
    where: { orderId: req.params.id },
    order: [["timestamp", "ASC"]],
  });

  const journey = STATUS_STEPS.map((step) => {
    const record = trackingRecords.find((t) => t.status === step);
    return {
      status: step,
      label: formatLabel(step),
      completed: !!record,
      timestamp: record ? record.timestamp : null,
    };
  });

  return successResponse({
    res,
    message: "Order tracking fetched",
    data: { orderId: order.id, journey },
    status: 200,
  });
});

module.exports = { updateOrderStatus, getOrderTracking };