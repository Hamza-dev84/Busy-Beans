
const express = require("express");
const router = express.Router();
const { createConnectAccount, checkConnectStatus, 
    createPaymentIntent, recordBankCheckPayment, 
    refreshOnboardingLink, handleWebhook } = require("../controllers/paymentController");
const { partnerProtect } = require("../middlewares/partnerAuthMiddlware");
const protect = require("../middlewares/authMiddleware");

router.post("/connect/create", partnerProtect, createConnectAccount);
router.get("/connect/status", partnerProtect, checkConnectStatus);
router.post("/connect/refresh", partnerProtect, refreshOnboardingLink);

router.post("/payment-intent", createPaymentIntent);
router.post("/bank-check", protect, recordBankCheckPayment);
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

module.exports = router;