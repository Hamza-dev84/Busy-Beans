
const express = require("express");
const router = express.Router();
const { createInvoice, getAllInvoices, getInvoice, deleteInvoice } = 
require("../controllers/invoiceController");
const protect = require("../middlewares/authMiddleware");

router.post("/", protect, createInvoice);
router.get("/", protect, getAllInvoices);
router.get("/:id", protect, getInvoice);
router.delete("/:id", protect, deleteInvoice);

module.exports = router;