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

  const existing = await LocalPartner.findOne({where: {email}});
  if(existing) return errorResponse({res, message: "Email already exist"});

  const image = req.file ? req.file.filename : null;

  const partner = await LocalPartner.create({
    image,
    name, partnerType, 
    status: status || "active",
    creditLimit: creditLimit || 0,
    country, state, city, zipCode, address, title, phone, email, password,
    shippingAddressLine1, shippingAddressLine2, shippingCountry, shippingState, shippingCity,
    shippingZipCode,
    billingSameAsShipping : billingSameAsShipping ?? true,
    billingAddressLine1: billingSameAsShipping ? shippingAddressLine1 : billingAddressLine1,
    billingAddressLine2: billingSameAsShipping ? shippingAddressLine2 : billingAddressLine2,
    billingCountry: billingSameAsShipping ? shippingCountry : billingCountry,
    billingState: billingSameAsShipping ? shippingState : billingState,
    billingCity: billingSameAsShipping ? shippingCity : billingCity,
    billingZipCode: billingSameAsShipping ? shippingZipCode : billingZipCode
  })

  successResponse({res, data: partner, message: "Partner created", status: 201})

})

const editPartner = asyncWrapper(async (req, res) => {
  const partner = await LocalPartner.findByPk(req.params.id);
  if(!partner) errorResponse({res, message: "Partner not found", status: 401});

  const image = req.file ? req.file.filename : partner.image;

  await partner.update({...req.body, image});
  return successResponse({res, data: partner, message: "Partner updated", status: 201});
})

const toggleStatus = asyncWrapper(async (req, res) => {
  const partner = await LocalPartner.findByPk(req.params.id);
  if(!partner) return errorResponse({res, message: "Partner not found", status: 401});

  const newStatus = partner.status === "active" ? "inactive" : "active";
  await partner.update({status: newStatus});
  return successResponse({
    res, 
    data: {status: newStatus}, 
    message: `Status changed to new status ${newStatus}`
  })
})

const deletePartner = asyncWrapper(async (req, res) => {
  const partner = await LocalPartner.findByPk(req.params.id);
  if(!partner) return errorResponse({res, message: "Partner not found", status: 201});

  await partner.destroy();
  return successResponse({res, data: partner, message: "Partner deleted sucessfuly", status: 201});
})
module.exports = { getAllPartners, addPartner, editPartner, toggleStatus, deletePartner };