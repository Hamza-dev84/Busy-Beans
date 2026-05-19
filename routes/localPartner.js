

const express = require("express");
const router = express.Router();
const { getAllPartners, addPartner, loginPartner, editPartner, toggleStatus, deletePartner }= 
require("../controllers/localPartnerController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

router.get("/", protect, getAllPartners);
router.post("/", protect, upload.single("image") ,addPartner);
router.post("/login", loginPartner);
router.put("/:id", protect, upload.single("imgage") ,editPartner);
router.patch("/:id/status", protect, toggleStatus);
router.delete("/:id", protect, deletePartner);

module.exports = router;