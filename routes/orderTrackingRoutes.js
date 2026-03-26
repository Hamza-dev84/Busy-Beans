
const express = require("express");
const router = express.Router();

const {updateOrderStatus, getOrderTracking} = require("../controllers/orderTrackingController");
const protect = require("../middlewares/authMiddleware");

router.patch("/:id/status", protect, updateOrderStatus);
router.get("/:id/tracking", protect, getOrderTracking);

module.exports = router;