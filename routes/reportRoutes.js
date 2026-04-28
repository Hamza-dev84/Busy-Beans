
const express = require("express");
const router = express.Router();
const {
    getPartnerProfitsReport,
    getPartnerCreditReport,
    getUnpaidPartnerBalanceReport,
    getProductSalesReport,
    getCustomerReport,
    getDirectPartnerReport,
    getSalesByCustomerSummaryReport,
    getProductWiseSalesSummary,
} = require("../controllers/reportController");
const protect = require("../middlewares/authMiddleware");

router.get("/partner-profits", protect, getPartnerProfitsReport);
router.get("/partner-credit-limit", protect, getPartnerCreditReport);
router.get("/unpaid-balance", protect, getUnpaidPartnerBalanceReport);
router.get("/product-sales", protect, getProductSalesReport);
router.get("/customers", protect, getCustomerReport);
router.get("/directPartners", protect, getDirectPartnerReport);
router.get("/sales-by-customer", protect, getSalesByCustomerSummaryReport);
router.get("/product-wise-sales", protect, getProductWiseSalesSummary);

module.exports = router;