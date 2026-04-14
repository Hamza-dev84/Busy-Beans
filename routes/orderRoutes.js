
const express = require("express");
const router = express.Router();
const {createOrder, getAllOrders, getOrder, getOrderDetail ,deleteOrder, getOrdersByStatus,
        getPartnerOrders, getPartnerOrderDetail} =  
require("../controllers/orderController");
const protect = require("../middlewares/authMiddleware");
const customerProtect = require("../middlewares/customerAuthMiddleware");

router.post("/", customerProtect, createOrder);
router.get("/", protect, getAllOrders);
router.get("/filter", protect, getOrdersByStatus);
router.get("/detail/:id", protect, getOrderDetail);
router.get("/order/:id", protect, getOrder);
router.get("/partnerOrders", protect, getPartnerOrders);
router.get("/partnerOrders/detail/:id", protect, getPartnerOrderDetail);
router.delete("/:id", protect, deleteOrder);

module.exports = router;