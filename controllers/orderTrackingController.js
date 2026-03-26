
const { Order, OrderTracking } = require("../models/index");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");

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
  const { status } = req.body;

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

  const tracking = await OrderTracking.create({
    orderId: order.id,
    status,
    timestamp: getPakistanTime(),
  });

  await order.update({ currentStatus: status });

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