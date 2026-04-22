
// const express = require("express");
// const router = express.Router();
// const protect = require("../middlewares/authMiddleware");
// const {getPartnerProfitsReport, getPartnerCreditReport, getUnpaidPartnerBalanceReport,
//         getProductSalesReport
// } = 
// require("../controllers/reportController");

// router.get("/partnerProfitReport", protect, getPartnerProfitsReport);
// router.get("/partnerCreditReport", protect, getPartnerCreditReport);
// router.get("/unpaidPartnerBalanceReport", protect, getUnpaidPartnerBalanceReport);
// router.get("/productSalesReport", protect, getProductSalesReport);

// module.exports = router;



const express = require("express");
const router = express.Router();
const {
    getPartnerProfitsReport,
    getPartnerCreditReport,
    getUnpaidPartnerBalanceReport,
    getProductSalesReport,
    // getCustomerReport,
    // getDirectPartnerReport,
    // getSalesByCustomerReport,
    // getProductWiseSalesSummary,
} = require("../controllers/reportController");
const protect = require("../middlewares/authMiddleware");

router.get("/partner-profits", protect, getPartnerProfitsReport);
router.get("/partner-credit-limit", protect, getPartnerCreditReport);
router.get("/unpaid-balance", protect, getUnpaidPartnerBalanceReport); //problem
router.get("/product-sales", protect, getProductSalesReport); //problem
// router.get("/customers", protect, getCustomerReport);
// router.get("/direct-partners", protect, getDirectPartnerReport);//  problem
// router.get("/sales-by-customer", protect, getSalesByCustomerReport);
// router.get("/product-wise-sales", protect, getProductWiseSalesSummary);

module.exports = router;