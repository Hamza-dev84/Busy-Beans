
const Supplier = require("../models/Supplier");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");


const getAllSuppliers = asyncWrapper(async (req, res) => {
    const suppliers = await Supplier.findAll({ order: [["createdAt", "DESC"]]});
    return successResponse({ res, data: suppliers, message: "Suppliers fetched", status: 200 });
});

const addSupplier = asyncWrapper(async (req, res) => {
    const {
        name, business_website, supplierType, status, registerDate,
        country, state, city, zipCode, address1, address2,
        countryCode, phone, bankAccountDetail, email, password,
    } = req.body;

    const existing = await Supplier.findOne({where: {email}});
    if(existing) return errorResponse({res, message: "Supplier already exist", status: 402});

    const image = req.file ? req.file.filename : null;

    const supplier = await Supplier.create({
        name, image: image, business_website, supplierType, state: status || "active", registerDate,
        country, state, city, zipCode, address1, address2, countryCode, phone, bankAccountDetail,
        email, password
    })

    return successResponse({res, data: supplier, message: "Supplier created successfuly", status: 201})
})

const editSupplier = asyncWrapper(async (req, res) => {
    const supplier = await Supplier.findByPk(req.params.id);
    if(!supplier) return errorResponse({res, message: "Supplier not found", status: 401});

    const image = req.file ? req.file.filename : supplier.image;

    await supplier.update({...req.body, image: image});
    return successResponse({res, data: supplier, message: "Supplier Updated successfuly", status: 201});

})

const toggleStatus = asyncWrapper(async (req, res) => {
    const supplier = await Supplier.findByPk(req.params.id);
    if(!supplier) return errorResponse({res, message: "Supplier not found", status: 401});

    const newStatus = supplier.status === "active" ? "inactive" : "active";
    await supplier.update({status: newStatus});
    return successResponse({res, data:  {status: newStatus}, message: `status changed to ${newStatus}`, status: 201})
})

const deleteSupplier = asyncWrapper(async (req, res) => {
    const supplier = await Supplier.findByPk(req.params.id);
    if(!supplier) return errorResponse({res, message: "Supplier cannot be empty", status: 201});

    await supplier.destroy();
    return successResponse({res, message: "Supplier deleted successfuly", status: 201});
})

module.exports = {
    getAllSuppliers, addSupplier, editSupplier, toggleStatus, deleteSupplier
}