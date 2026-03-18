
const express = require("express");
const router = express.Router();
const {getAllProducts, addProduct, editProduct, toggleStatus,deleteProduct} = 
require("../controllers/productController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

router.get("/", protect, getAllProducts);
router.post("/", protect, upload.single("image"), addProduct);
router.put("/:id", protect, upload.single("image"), editProduct);
router.patch("/:id/status", protect, toggleStatus);
router.delete("/:id", protect, deleteProduct);

module.exports = router;
