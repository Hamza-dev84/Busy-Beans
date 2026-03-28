

const jwt = require("jsonwebtoken");
const Customer = require("../models/customer");

const customerProtect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findByPk(decoded.id);
    if (!customer) return res.status(401).json({ message: "Customer not found" });
    req.customer = customer;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = customerProtect;