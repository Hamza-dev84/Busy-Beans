
const express = require("express");
const router = express.Router();
const {createOrder, getAllOrders, getOrder, getOrderDetail ,deleteOrder, getOrdersByStatus} =  
require("../controllers/orderController");
const protect = require("../middlewares/authMiddleware");
const customerProtect = require("../middlewares/customerAuthMiddleware");

router.post("/", customerProtect, createOrder);
router.get("/", protect, getAllOrders);
router.get("/filter", protect, getOrdersByStatus);
router.get("/:id/detail", protect, getOrderDetail);
router.get("/:id", protect, getOrder);
router.delete("/:id", protect, deleteOrder);

module.exports = router;