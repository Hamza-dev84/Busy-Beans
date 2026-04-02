
const LocalPartner = require("../models/LocalPartner");
const asyncWrapper = require("../utilities/asyncWrapper");
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

  return successResponse({ res, data: partner, message: "Partner created", status: 201 }); // ← return missing tha
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

module.exports = { getAllPartners, addPartner, editPartner, toggleStatus, deletePartner };