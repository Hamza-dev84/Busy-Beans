
const express = require("express");
const router = express.Router();
const {  createPaymentIntent, connectOrCheckStripeAccount,
    recordBankCheckPayment, handleWebhook } = require("../controllers/paymentController");
const { partnerProtect } = require("../middlewares/partnerAuthMiddlware");
const protect = require("../middlewares/authMiddleware");

router.post("/connect", partnerProtect, connectOrCheckStripeAccount);
router.post("/payment-intent", createPaymentIntent);
router.post("/bank-check", protect, recordBankCheckPayment);
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

module.exports = router;