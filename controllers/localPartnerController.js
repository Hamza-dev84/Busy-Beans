
const LocalPartner = require("../models/LocalPartner");
const asyncWrapper = require("../utilities/asyncWrapper");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { successResponse, errorResponse } = require("../utilities/responseHandler");

const getAllPartners = asyncWrapper(async (req, res) => {
  const partners = await LocalPartner.findAll({ order: [["createdAt", "DESC"]] });
  return successResponse({ res, message: "Partners fetched", data: partners, status: 200 });
});

const addPartner = asyncWrapper(async (req, res) => {
  const {
    name, partnerType, status, creditLimit,
    country, state, city, zipCode, address, title, phone,
    email, password,
    shippingAddressLine1, shippingAddressLine2, shippingCountry, shippingState, shippingCity, shippingZipCode,
    billingSameAsShipping, billingAddressLine1, billingAddressLine2, billingCountry, billingState, billingCity, billingZipCode,
  } = req.body;

  const existing = await LocalPartner.findOne({ where: { email } });
  if (existing) return errorResponse({ res, message: "Email already exist", status: 409 });

  const image = req.file ? req.file.filename : null;

  const isSame = billingSameAsShipping === "true" || billingSameAsShipping === true;

  const partner = await LocalPartner.create({
    Image: image,
    name, partnerType,
    status: status || "active",
    creditLimit: creditLimit || 0,
    country, state, city, zipCode, address, title, phone, email, password,
    shippingAddressLine1, shippingAddressLine2, shippingCountry, shippingState, shippingCity, shippingZipCode,
    billingSameAsShipping: isSame,
    billingAddressLine1: isSame ? shippingAddressLine1 : billingAddressLine1,
    billingAddressLine2: isSame ? shippingAddressLine2 : billingAddressLine2,
    billingCountry: isSame ? shippingCountry : billingCountry,
    billingState: isSame ? shippingState : billingState,
    billingCity: isSame ? shippingCity : billingCity,
    billingZipCode: isSame ? shippingZipCode : billingZipCode,
  });

  return successResponse({ res, data: partner, message: "Partner created", status: 201 });
});

const loginPartner = asyncWrapper(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return errorResponse({ res, message: "Email and password are required", status: 400 });
    }

    const partner = await LocalPartner.findOne({ where: { email } });
    if (!partner) return errorResponse({ res, message: "Invalid email or password", status: 401 });

    const isMatch = await bcrypt.compare(password, partner.password);
    if (!isMatch) return errorResponse({ res, message: "Invalid email or password", status: 401 });

    if (partner.status === "inactive") {
        return errorResponse({ res, message: "Your account is inactive", status: 403 });
    }

    const token = jwt.sign({ id: partner.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    const stripeLinked = partner.stripeAccountId && partner.stripeAccountStatus === "active";

    return successResponse({
        res,
        message: "Login successful",
        data: {
            token,
            partner: {
                id: partner.id,
                name: partner.name,
                email: partner.email,
                stripeLinked,
                stripeAccountStatus: partner.stripeAccountStatus || null,
                onboardingRequired: !stripeLinked,
            }
        },
        status: 200
    });
});


const editPartner = asyncWrapper(async (req, res) => {
  const partner = await LocalPartner.findByPk(req.params.id);
  if (!partner) return errorResponse({ res, message: "Partner not found", status: 404 }); // ← return missing tha

  const image = req.file ? req.file.filename : partner.Image;
  await partner.update({ ...req.body, Image: image });
  return successResponse({ res, data: partner, message: "Partner updated", status: 200 });
});

const toggleStatus = asyncWrapper(async (req, res) => {
  const partner = await LocalPartner.findByPk(req.params.id);
  if (!partner) return errorResponse({ res, message: "Partner not found", status: 404 });

  const newStatus = partner.status === "active" ? "inactive" : "active";
  await partner.update({ status: newStatus });
  return successResponse({ res, data: { newStatus }, message: `Status changed to ${newStatus}`, status: 200 });
});

const deletePartner = asyncWrapper(async (req, res) => {
  const partner = await LocalPartner.findByPk(req.params.id);
  if (!partner) return errorResponse({ res, message: "Partner not found", status: 404 }); // ← 201 → 404

  await partner.destroy();
  return successResponse({ res, data: null, message: "Partner deleted successfully", status: 200 });
});

module.exports = { getAllPartners, addPartner, loginPartner, editPartner, toggleStatus, deletePartner };