

const express = require("express");
const router = express.Router();
const { getAllPartners, addPartner, editPartner, toggleStatus, deletePartner }= 
require("../controllers/localPartnerController");
const protect = require("../middlewares/authMiddleware");

router.get("/", protect, getAllPartners);
router.post("/", protect, addPartner);
router.put("/:id", protect, editPartner);
router.patch("/:id/status", protect, toggleStatus);
router.delete("/:id", protect, deletePartner);

module.exports = router;