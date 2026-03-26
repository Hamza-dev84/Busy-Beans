const LocalPartner = require("../models/LocalPartner");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");


const getAllPartners = asyncWrapper(async (req, res) => {
  const partners = await LocalPartner.findAll({ order: [["createdAt", "DESC"]] });
  return successResponse({ res, message: "Partners fetched", data: partners, status: 200 });
});


const addPartner = asyncWrapper(async (req, res) => {
  const { name, territory, partnerType } = req.body;

  const partner = await LocalPartner.create({ name, territory, partnerType });
  return successResponse({ res, message: "Partner added", data: partner, status: 201 });
});


const editPartner = asyncWrapper(async (req, res) => {
  const partner = await LocalPartner.findByPk(req.params.id);
  if (!partner) return errorResponse({ res, message: "Partner not found", status: 404 });

  const { name, territory, partnerType } = req.body;

  await partner.update({
    name: name || partner.name,
    territory: territory || partner.territory,
    partnerType: partnerType || partner.partnerType,
  });

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