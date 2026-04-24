
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
    // getProductWiseSalesSummary,
} = require("../controllers/reportController");
const protect = require("../middlewares/authMiddleware");

router.get("/partner-profits", protect, getPartnerProfitsReport);
router.get("/partner-credit-limit", protect, getPartnerCreditReport);
router.get("/unpaid-balance", protect, getUnpaidPartnerBalanceReport); //problem
router.get("/product-sales", protect, getProductSalesReport); //problem
router.get("/customers", protect, getCustomerReport);
router.get("/directPartners", protect, getDirectPartnerReport);//  problem
router.get("/sales-by-customer", protect, getSalesByCustomerSummaryReport);
// router.get("/product-wise-sales", protect, getProductWiseSalesSummary);

module.exports = router;