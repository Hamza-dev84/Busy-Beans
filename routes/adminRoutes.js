
const {register, login, getMe} = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");
const express = require("express");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/getMe", protect, getMe);

module.exports = router;