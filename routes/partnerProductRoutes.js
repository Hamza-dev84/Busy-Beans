
const express = require("express");
const router = express.Router();
const {
    getAllPartners,
    getPartnerProducts,
    getUnassignedProducts,
    getPartnerCustomers,
    addProductToPartner,
    changePartnerProductPrice,
    removeProductFromPartner
} = require("../controllers/partnerProductController");
const protect = require("../middlewares/authMiddleware");

router.get("/", protect, getAllPartners);
router.get("/:partnerId/products", protect, getPartnerProducts);
router.get("/:partnerId/unassigned", protect, getUnassignedProducts);
router.get("/:partnerId/customers", protect, getPartnerCustomers);
router.post("/add", protect, addProductToPartner);
router.post("/update-prices", protect, changePartnerProductPrice);
router.delete("/:id/remove", protect, removeProductFromPartner);

module.exports = router;