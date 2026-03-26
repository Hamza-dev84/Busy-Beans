
// const { Order, OrderTracking } = require("../models/index");
// const asyncWrapper = require("../utilities/asyncWrapper");
// const { successResponse, errorResponse } = require("../utilities/responseHandler");

// const STATUS_STEPS = [
//     "order_placed",
//     "dispatched_to_supplier",
//     "supplier_acknowledged",
//     "shipped",
// ];

// const updateOrderStatus = asyncWrapper(async (req, res) => {
//     const { status } = req.body;
//     if (!status) return errorResponse({ res, message: "Status is required", status: 400 });
//     const order = await Order.findByPk(req.params.id);
//     if (!order) return errorResponse({ res, message: "Order not found", status: 401 });

//     const alreadyExists = await OrderTracking.findOne({
//         where: { orderId: order.id, status }
//     });

//     if (alreadyExists) {
//         return errorResponse({ res, message: `Status ${status} already exist`, status: 401 })
//     }

//     const tracking = OrderTracking.create({
//         orderId: order.id,
//         status,
//         timestamp: new Date()
//     })

//     await order.update({ status: status === "shipped" ? "completed" : "pending" });

//     return successResponse({ res, data: tracking, message: "Order status updated", status: 201 });
// })

// const getOrderTracking = asyncWrapper(async (req, res) => {
//     const order = await Order.findByPk(req.params.id);
//     if(!order) return errorResponse({res, message: "Order not found", status: 401});

//     const trackingRecords = await OrderTracking.findAll({
//         where: {orderId: req.params.id},
//         order: [["timestamp", "ASC"]]
//     })

//     const journey = STATUS_STEPS.map((step) => {
//         const record = trackingRecords.find((t) => t.status === step);
//         return {
//             status: step,
//             label: formatLabel(step),
//             completed: !!record,
//             timestamp: record ? record.timestamp : null
//         }
//     })

//     return successResponse({
//         res, 
//         data: {orderId: order.id, journey}, 
//         message: "Order tracked successfully",
//         status: 201
//     })
// })

// const formatLabel = (status) => {
//     const labels = {
//         order_placed: "Order Placed",
//         dispatched_to_supplier: "Dispatched to Supplier",
//         supplier_acknowledged: "Supplier Acknowledged",
//         shipped: "Shipped Orders"
//     }
//     return labels[status] || status;
// }

// module.exports = {
//     updateOrderStatus,
//     getOrderTracking
// }





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

// PATCH /orders/:id/status
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

  await order.update({ status: status === "shipped" ? "completed" : "pending" });

  return successResponse({ res, message: "Order status updated", data: tracking, status: 201 });
});

// GET /orders/:id/tracking
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