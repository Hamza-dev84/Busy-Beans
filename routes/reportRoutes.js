
const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {getPartnerProfitsReport, getPartnerCreditReport, getUnpaidPartnerBalanceReport} = 
require("../controllers/reportController");

router.get("/partnerProfitReport", protect, getPartnerProfitsReport);
router.get("/partnerCreditReport", protect, getPartnerCreditReport);
router.get("/unpaidPartnerBalanceReport", protect, getUnpaidPartnerBalanceReport);

module.exports = router;