const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const generateToken = require("../utilities/generateToken");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");

const register = asyncWrapper(async (req, res) => {
  const existing = await Admin.findOne();
  if (existing) return errorResponse({ res, message: "Admin already exists", status: 403 });

  const { email, password } = req.body;
  if (!email || !password) return errorResponse({ res, message: "Email and password required", status: 400 });

  await Admin.create({ email, password });
  return successResponse({ res, message: "Admin registered successfully", status: 201 });
});

const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return errorResponse({ res, message: "Email and password required", status: 400 });

  const admin = await Admin.findOne({ where: { email } });
  if (!admin) return errorResponse({ res, message: "Invalid email or password", status: 401 });

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return errorResponse({ res, message: "Invalid email or password", status: 401 });

  const token = generateToken(admin);
  return successResponse({ res, message: "Login successful", data: { token }, status: 200 });
});

const getMe = asyncWrapper(async (req, res) => {
  return successResponse({ res, message: "Admin fetched", data: { admin: req.admin }, status: 200 });
});

module.exports = { register, login, getMe };