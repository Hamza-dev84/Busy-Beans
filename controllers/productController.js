
const Product = require("../models/product");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");

const getAllProducts = asyncWrapper(async (req, res) => {
    const products = await Product.findAll({ order: [["createdAt", "DESC"]] });

    const formattedProducts = products.map(product => ({
        ...product.toJSON(),
        price: `$${product.price}`,
        wholeSalePrice: `$${product.wholeSalePrice}`
    }));

    return successResponse({
        res,
        data: formattedProducts,
        message: "Products fetched successfuly",
        status: 201
    });
});

const addProduct = asyncWrapper(async (req, res) => {
    const { name, weight, price, wholeSalePrice, productCode, sku, grind } = req.body;

    const image = req.file ? req.file.filename : null;

    const product = await Product.create({ image, name, weight, price, wholeSalePrice, productCode, sku, grind });

    return successResponse({ res, data: product, message: "Product Added", status: 201 });
});

const editProduct = asyncWrapper(async (req, res) => {
    const product = await Product.findByPk(req.params.id);
    if (!product) errorResponse({ res, message: "Product not found", status: 401 });

    const { name, weight, price, wholeSalePrice, productCode, sku, grind } = req.body;
    const image = req.file ? req.file.filename : product.image;

    await product.update({ image, name, weight, price, wholeSalePrice, productCode, sku, grind });
    return successResponse({ res, data: product, message: "Product Updated", status: 201 });
});

const toggleStatus = asyncWrapper(async (req, res) => {
    const product = await Product.findByPk(req.params.id);
    if (!product) return errorResponse({ res, message: "Product not found", status: 401 });

    const newStatus = product.status === "active" ? "inactive" : "active";
    await product.update({ status: newStatus });
    successResponse({
        res,
        data: { status: newStatus },
        message: `status changed to new status ${newStatus}`,
        status: 201
    });
});

const deleteProduct = asyncWrapper(async (req, res) => {
    const product = await Product.findByPk(req.params.id);
    if (!product) return errorResponse({ res, message: "Product not found", status: 401 });

    await product.destroy();

    return successResponse({ res, message: "Product deleted", status: 201 });
});

module.exports = {
    getAllProducts,
    addProduct,
    editProduct,
    toggleStatus,
    deleteProduct
}

