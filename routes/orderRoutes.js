
const express = require("express");
const router = express.Router();

const protect = require("../middlewares/authMiddleware");
const { createOrder, getAllOrders, getOrder,deleteOrder } = 
require("../controllers/orderController");

router.post("/", protect, createOrder);
router.get("/", protect, getAllOrders);
router.get("/:id", protect, getOrder);
router.delete("/:id", protect, deleteOrder);

module.exports = router;