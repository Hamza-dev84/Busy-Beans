
const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
    getPartnerProfitsReport, getPartnerCreditReport
} = require("../controllers/reportController");

router.get("/partnerProfitReport", protect, getPartnerProfitsReport);
router.get("/PartnerCreditReport", protect, getPartnerCreditReport);

module.exports = router;