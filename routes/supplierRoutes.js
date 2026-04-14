
const express = require("express");
const router = express.Router();
const {getAllSuppliers, addSupplier, editSupplier, toggleStatus, deleteSupplier} = 
require("../controllers/supplierController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

router.get("/", protect, getAllSuppliers);
router.post("/", protect, upload.single("image"), addSupplier);
router.put("/:id", protect, upload.single("image"), editSupplier);
router.patch("/:id/status", protect, toggleStatus);
router.delete("/:id", protect, deleteSupplier)

module.exports = router;