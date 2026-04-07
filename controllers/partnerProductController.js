
const { sequelize } = require("../config/db");
const PartnerProduct = require("../models/PartnerProduct");
const Product = require("../models/Product");
const LocalPartner = require("../models/LocalPartner");
const Customer = require("../models/Customer");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");
const { Op } = require("sequelize");

const getAllPartners = asyncWrapper(async (req, res) => {
    const partners = await LocalPartner.findAll({
        where: { status: "active" }
    });

    return successResponse({ res, data: partners, message: "Partners fetched successfuly", status: 201 });
});

const getPartnerProducts = asyncWrapper(async (req, res) => {
    const { partnerId } = req.params;

    const partnerProduct = await PartnerProduct.findAll({
        where: { partnerId },
        include: [{ model: Product, as: "product" }]
    });

    return successResponse({
        res,
        data: partnerProduct,
        message: "Partner Product fetched successfuly",
        status: 201
    });
});

const getUnassignedProducts = asyncWrapper(async (req, res) => {
    const { productId } = req.params;
    const assigned = await PartnerProduct.findAll({ where: { productId } });

    const assignedIds = assigned.map(p => p.productId);
    const products = await Product.findAll({
        where: assignedIds.length > 0
            ? { id: { [Op.notIn]: assignedIds }, status: "active" }
            : { status: "active" }
    });

    return successResponse({ res, data: products, message: "Unassigned Products fetched", status: 201 });
});

const getPartnerCustomers = asyncWrapper(async (req, res) => {
    const { partnerId } = req.params;
    const customers = await Customer.findAll({
        where: { localPartnerId: partnerId }
    });

    return successResponse({ res, data: customers, message: "Partner customers fetched", status: 201 });
});

const addProductToPartner = asyncWrapper(async (req, res) => {
    const { partnerId, productId, sellingPrice, wholesalePrice } = req.body;

    const already = await PartnerProduct.findOne({ where: { partnerId, productId } });
    if (already) return errorResponse({ res, message: "Product already assigned", status: 409 });

    const partnerProduct = await PartnerProduct.create({
        partnerId,
        productId,
        sellingPrice: sellingPrice || null,
        wholesalePrice: wholesalePrice || null
    });

    return successResponse({ res, data: partnerProduct, message: "Product added to partner", status: 201 });
});

const changePartnerProductPrice = asyncWrapper(async (req, res) => {
    const { partnerId, prices } = req.body;

    await sequelize.transaction(async (t) => {
        await Promise.all(
            prices.map(async ({ productId, sellingPrice, wholesalePrice }) => {
                const partnerProduct = await PartnerProduct.findOne({
                    where: { partnerId, productId },
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                });

                if (!partnerProduct) {
                    throw { statusCode: 404, message: `Partner product ${productId} not found for partner ${partnerId}` };
                }

                await partnerProduct.update({ sellingPrice, wholesalePrice }, { transaction: t });
            })
        );
    });

    const updated = await PartnerProduct.findAll({
        where: { partnerId },
        include: [{ model: Product, as: "product" }]
    });

    return successResponse({ res, data: updated, message: "Prices updated successfuly", status: 201 });
});


const removeProductFromPartner = asyncWrapper(async (req, res) => {
    const { id } = req.params;

    const partnerProduct = await PartnerProduct.findByPk(id);
    if (!partnerProduct) return errorResponse({ res, message: "Partner Product not found", status: 401 });

    await partnerProduct.destroy();
    return successResponse({ res, message: "Partner Product removed", status: 201 });
});

module.exports = {
    getAllPartners,
    getPartnerProducts,
    getUnassignedProducts,
    getPartnerCustomers,
    addProductToPartner,
    changePartnerProductPrice,
    removeProductFromPartner,
};