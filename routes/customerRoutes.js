
const express = require("express");
const router = express.Router();
const {register, login, showAllCustomers} = require("../controllers/customerController");
const protect = require("../middlewares/authMiddleware")

router.post("/register", register);
router.post("/login", login);
router.get("/", protect, showAllCustomers)

module.exports = router;