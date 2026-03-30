
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

  
  if (!name || !partnerType || !country || !state || !city || !zipCode || !address || !phone || !email || !password || !shippingAddressLine1 || !shippingCountry || !shippingState || !shippingCity || !shippingZipCode) {
    return errorResponse({ res, message: "Please fill all required fields", status: 400 });
  }


  const existing = await LocalPartner.findOne({ where: { email } });
  if (existing) return errorResponse({ res, message: "Email already registered", status: 409 });

  const partner = await LocalPartner.create({
    name, partnerType, status: status || "active", creditLimit: creditLimit || 0,
    country, state, city, zipCode, address, title, phone,
    email, password,
    shippingAddressLine1, shippingAddressLine2, shippingCountry, shippingState, shippingCity, shippingZipCode,
    billingSameAsShipping: billingSameAsShipping ?? true,
    billingAddressLine1: billingSameAsShipping ? shippingAddressLine1 : billingAddressLine1,
    billingAddressLine2: billingSameAsShipping ? shippingAddressLine2 : billingAddressLine2,
    billingCountry: billingSameAsShipping ? shippingCountry : billingCountry,
    billingState: billingSameAsShipping ? shippingState : billingState,
    billingCity: billingSameAsShipping ? shippingCity : billingCity,
    billingZipCode: billingSameAsShipping ? shippingZipCode : billingZipCode,
  });

  return successResponse({ res, message: "Partner added successfully", data: partner, status: 201 });
});


const editPartner = asyncWrapper(async (req, res) => {
  const partner = await LocalPartner.findByPk(req.params.id);
  if (!partner) return errorResponse({ res, message: "Partner not found", status: 404 });

  await partner.update(req.body);
  return successResponse({ res, message: "Partner updated", data: partner, status: 200 });
});


const toggleStatus = asyncWrapper(async (req, res) => {
  const partner = await LocalPartner.findByPk(req.params.id);
  if (!partner) return errorResponse({ res, message: "Partner not found", status: 404 });

  const newStatus = partner.status === "active" ? "inactive" : "active";
  await partner.update({ status: newStatus });
  return successResponse({ res, message: `Status changed to ${newStatus}`, data: { status: newStatus }, status: 200 });
});


const deletePartner = asyncWrapper(async (req, res) => {
  const partner = await LocalPartner.findByPk(req.params.id);
  if (!partner) return errorResponse({ res, message: "Partner not found", status: 404 });

  await partner.destroy();
  return successResponse({ res, message: "Partner deleted", status: 200 });
});

module.exports = { getAllPartners, addPartner, editPartner, toggleStatus, deletePartner };