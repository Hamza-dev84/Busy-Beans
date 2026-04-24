const { Op, fn, col, literal } = require("sequelize");
const { Order, OrderItem, OrderProfit, LocalPartner, Customer, Product } = require("../models/index");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");
const { getPagination, getPaginationData } = require("../services/paginationService");

const getPartnerProfitsReport = asyncWrapper(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    let dateFilter = {};
    if (startDate) dateFilter.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) dateFilter.createdAt = { ...dateFilter.createdAt, [Op.lte]: new Date(endDate) };

    const { rows } = await LocalPartner.findAndCountAll({
        attributes: [
            "id", "name", "email",
            [fn("COUNT", col("orders.id")), "ordersPlaced"],
            [fn("SUM", col("orders->profit.orderTotal")), "totalSales"],
            [fn("SUM", col("orders->profit.wholeSaleTotal")), "wholeSaleCost"],
            [fn("SUM", col("orders->profit.partnerProfit")), "totalPartnerProfit"],
            [fn("SUM", col("orders->profit.adminReceives")), "adminReceives"],
        ],
        include: [{
            model: Order, as: "orders", attributes: [], required: false,
            where: { isLocalPartner: true, customerId: { [Op.ne]: null }, ...dateFilter },
            include: [{ model: OrderProfit, as: "profit", attributes: [], required: false }]
        }],
        group: ["LocalPartner.id"],
        limit: limitNumber, offset, subQuery: false
    });

    const report = rows.map(p => ({
        partnerId: p.id,
        partnerName: p.name,
        partnerEmail: p.email,
        ordersPlaced: parseInt(p.dataValues.ordersPlaced) || 0,
        totalSales: `$${parseFloat(p.dataValues.totalSales || 0).toFixed(2)}`,
        wholeSaleCost: `$${parseFloat(p.dataValues.wholeSaleCost || 0).toFixed(2)}`,
        totalPartnerProfit: `$${parseFloat(p.dataValues.totalPartnerProfit || 0).toFixed(2)}`,
        adminReceives: `$${parseFloat(p.dataValues.adminReceives || 0).toFixed(2)}`,
    }));

    return successResponse({ res, message: "Partner profit report fetched", data: getPaginationData(rows.length, report, pageNumber, limitNumber), status: 200 });
});


const getPartnerCreditLimitReport = asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    const { rows } = await LocalPartner.findAndCountAll({
        attributes: [
            "id", "name", "creditLimit",
            [fn("SUM", col("orders.total")), "creditUsed"],
        ],
        include: [{
            model: Order, as: "orders", attributes: [], required: false,
            where: { status: { [Op.ne]: "completed" } }
        }],
        group: ["LocalPartner.id"],
        limit: limitNumber, offset, subQuery: false
    });

    const report = rows.map(p => {
        const creditLimit = parseFloat(p.creditLimit || 0);
        const creditUsed = parseFloat(p.dataValues.creditUsed || 0);
        const utilization = creditLimit > 0 ? ((creditUsed / creditLimit) * 100).toFixed(2) : "0.00";

        return {
            localPartnerName: p.name,
            creditLimit: `$${creditLimit.toFixed(2)}`,
            creditUsed: `$${creditUsed.toFixed(2)}`,
            creditUtilization: `${utilization}%`,
        };
    });

    return successResponse({ res, message: "Partner credit limit report fetched", data: getPaginationData(rows.length, report, pageNumber, limitNumber), status: 200 });
});


const getUnpaidPartnerBalanceReport = asyncWrapper(async (req, res) => {
    const { type, page = 1, limit = 10 } = req.query;

    if (!type || !["dropship", "direct"].includes(type.toLowerCase())) {
        return errorResponse({ res, message: "type is required: dropship or direct", status: 400 });
    }

    const { pageNumber, limitNumber, offset } = getPagination(page, limit);
    const partnerType = type.toLowerCase();

    if (partnerType === "dropship") {
        const { rows } = await LocalPartner.findAndCountAll({
            where: { partnerType: "dropship" },
            attributes: [
                "id", "name", "partnerType",
                [fn("SUM", col("orders.total")), "outstandingBalance"],
                [fn("COUNT", col("orders.id")), "ordersOnCredit"],
            ],
            include: [{
                model: Order, as: "orders", attributes: [], required: false,
                where: { status: { [Op.ne]: "completed" } }
            }],
            group: ["LocalPartner.id"],
            limit: limitNumber, offset, subQuery: false
        });

        const report = rows.map(p => ({
            partnerType: p.partnerType,
            partnerName: p.name,
            outstandingBalance: `$${parseFloat(p.dataValues.outstandingBalance || 0).toFixed(2)}`,
            ordersOnCredit: parseInt(p.dataValues.ordersOnCredit) || 0,
        }));

        return successResponse({ res, message: "DropShip partner balance report fetched", data: getPaginationData(rows.length, report, pageNumber, limitNumber), status: 200 });

    } else {
        const { rows } = await LocalPartner.findAndCountAll({
            where: { partnerType: "direct" },
            attributes: [
                "id", "name",
                [fn("SUM", col("orders.total")), "outstandingBalance"],
                [fn("COUNT", col("orders.id")), "ordersOnCredit"],
                [fn("SUM", literal("CASE WHEN `orders`.`customerId` IS NULL THEN `orders`.`total` ELSE 0 END")), "creditOnPartnerOrders"],
                [fn("SUM", literal("CASE WHEN `orders`.`customerId` IS NOT NULL THEN `orders->profit`.`partnerProfit` ELSE 0 END")), "creditOnCustomerOrders"],
                [fn("COUNT", literal("CASE WHEN `orders`.`customerId` IS NULL THEN 1 END")), "partnerOrders"],
                [fn("COUNT", literal("CASE WHEN `orders`.`customerId` IS NOT NULL THEN 1 END")), "customerOrders"],
            ],
            include: [{
                model: Order, as: "orders", attributes: [], required: false,
                where: { status: { [Op.ne]: "completed" } },
                include: [{ model: OrderProfit, as: "profit", attributes: [], required: false }]
            }],
            group: ["LocalPartner.id"],
            limit: limitNumber, offset, subQuery: false
        });

        const report = rows.map(p => ({
            partnerName: p.name,
            outstandingBalance: `$${parseFloat(p.dataValues.outstandingBalance || 0).toFixed(2)}`,
            ordersOnCredit: parseInt(p.dataValues.ordersOnCredit) || 0,
            partnerOrders: parseInt(p.dataValues.partnerOrders) || 0,
            customerOrders: parseInt(p.dataValues.customerOrders) || 0,
            creditOnPartnerOrders: `$${parseFloat(p.dataValues.creditOnPartnerOrders || 0).toFixed(2)}`,
            creditOnCustomerOrders: `$${parseFloat(p.dataValues.creditOnCustomerOrders || 0).toFixed(2)}`,
        }));

        return successResponse({ res, message: "Direct partner balance report fetched", data: getPaginationData(rows.length, report, pageNumber, limitNumber), status: 200 });
    }
});


const getProductSalesReport = asyncWrapper(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    let dateFilter = {};
    if (startDate) dateFilter.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) dateFilter.createdAt = { ...dateFilter.createdAt, [Op.lte]: new Date(endDate) };

    const { rows } = await Product.findAndCountAll({
        attributes: [
            "id", "name", "price", "wholeSalePrice",
            [fn("SUM", literal("`orderItems->order`.`total`")), "revenue"],
            [fn("SUM", col("orderItems.quantity")), "unitsSold"],
            [fn("SUM", literal("CASE WHEN `orderItems->order`.`isLocalPartner` = 0 THEN `orderItems`.`unitPrice` * `orderItems`.`quantity` ELSE 0 END")), "revenueFromCustomerOrders"],
            [fn("SUM", literal("CASE WHEN `orderItems->order`.`isLocalPartner` = 1 AND `orderItems->order`.`customerId` IS NULL THEN `orderItems`.`unitPrice` * `orderItems`.`quantity` ELSE 0 END")), "revenueFromPartnerSelfOrders"],
            [fn("SUM", literal("CASE WHEN `orderItems->order`.`isLocalPartner` = 0 THEN `orderItems`.`quantity` ELSE 0 END")), "unitsSoldToCustomers"],
            [fn("SUM", literal("CASE WHEN `orderItems->order`.`isLocalPartner` = 1 AND `orderItems->order`.`customerId` IS NULL THEN `orderItems`.`quantity` ELSE 0 END")), "unitsSoldToPartners"],
        ],
        include: [{
            model: OrderItem, as: "orderItems", attributes: [], required: false,
            include: [{
                model: Order, as: "order", attributes: [], required: false,
                where: { status: "completed", ...dateFilter }
            }]
        }],
        group: ["Product.id"],
        limit: limitNumber, offset, subQuery: false
    });

    const report = rows.map(p => ({
        productName: p.name,
        revenue: `$${parseFloat(p.dataValues.revenue || 0).toFixed(2)}`,
        revenueFromCustomerOrders: `$${parseFloat(p.dataValues.revenueFromCustomerOrders || 0).toFixed(2)}`,
        unitsSold: parseInt(p.dataValues.unitsSold) || 0,
        revenueFromPartnerSelfOrders: `$${parseFloat(p.dataValues.revenueFromPartnerSelfOrders || 0).toFixed(2)}`,
        adminReceivableFromPartner: `$${(parseFloat(p.wholeSalePrice || 0) * (parseInt(p.dataValues.unitsSoldToPartners) || 0)).toFixed(2)}`,
        unitsSoldToCustomers: parseInt(p.dataValues.unitsSoldToCustomers) || 0,
        unitsSoldToPartners: parseInt(p.dataValues.unitsSoldToPartners) || 0,
    }));

    return successResponse({ res, message: "Product sales report fetched", data: getPaginationData(rows.length, report, pageNumber, limitNumber), status: 200 });
});


const getCustomerReport = asyncWrapper(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    let dateFilter = {};
    if (startDate) dateFilter.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) dateFilter.createdAt = { ...dateFilter.createdAt, [Op.lte]: new Date(endDate) };

    const { rows } = await Customer.findAndCountAll({
        attributes: [
            "id", "userName", "companyName", "email",
            [fn("COUNT", col("orders.id")), "numberOfOrders"],
            [fn("MAX", col("orders.createdAt")), "lastOrderDate"],
            [fn("SUM", literal("CASE WHEN `orders`.`status` = 'completed' THEN `orders`.`total` ELSE 0 END")), "totalSpent"],
            [fn("SUM", literal("CASE WHEN `orders`.`status` != 'completed' THEN `orders`.`total` ELSE 0 END")), "outstandingBalance"],
            [fn("AVG", literal("CASE WHEN `orders`.`status` = 'completed' THEN `orders`.`total` ELSE NULL END")), "avgSpent"],
        ],
        include: [{
            model: Order, as: "orders", attributes: [], required: false,
            where: dateFilter
        }],
        group: ["Customer.id"],
        limit: limitNumber, offset, subQuery: false
    });

    const report = rows.map(c => ({
        customerName: c.userName,
        companyName: c.companyName,
        numberOfOrders: parseInt(c.dataValues.numberOfOrders) || 0,
        lastOrderDate: c.dataValues.lastOrderDate || null,
        outstandingBalance: `$${parseFloat(c.dataValues.outstandingBalance || 0).toFixed(2)}`,
        avgSpent: `$${parseFloat(c.dataValues.avgSpent || 0).toFixed(2)}`,
        totalSpent: `$${parseFloat(c.dataValues.totalSpent || 0).toFixed(2)}`,
    }));

    return successResponse({ res, message: "Customer report fetched", data: getPaginationData(rows.length, report, pageNumber, limitNumber), status: 200 });
});


const getDirectPartnerReport = asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    const { rows } = await LocalPartner.findAndCountAll({
        where: { partnerType: "direct" },
        attributes: [
            "id", "name", "state",
            [fn("COUNT", col("orders.id")), "totalOrders"],
            [fn("COUNT", literal("CASE WHEN `orders`.`customerId` IS NOT NULL THEN 1 END")), "clientOrders"],
            [fn("COUNT", literal("CASE WHEN `orders`.`customerId` IS NULL THEN 1 END")), "selfOrders"],
        ],
        include: [{
            model: Order, as: "orders", attributes: [], required: false
        }],
        group: ["LocalPartner.id"],
        limit: limitNumber, offset, subQuery: false
    });

    const report = rows.map(p => ({
        partnerName: p.name,
        territory: p.state,
        clientOrders: parseInt(p.dataValues.clientOrders) || 0,
        selfOrders: parseInt(p.dataValues.selfOrders) || 0,
        totalOrders: parseInt(p.dataValues.totalOrders) || 0,
    }));

    return successResponse({ res, message: "Direct partner report fetched", data: getPaginationData(rows.length, report, pageNumber, limitNumber), status: 200 });
});

const getSalesByCustomerReport = asyncWrapper(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    let dateFilter = {};
    if (startDate) dateFilter.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) dateFilter.createdAt = { ...dateFilter.createdAt, [Op.lte]: new Date(endDate) };

    const { rows } = await Customer.findAndCountAll({
        attributes: [
            "id", "companyName",
            [fn("SUM", col("orders.total")), "total"],
        ],
        include: [{
            model: Order, as: "orders", attributes: [], required: false,
            where: { status: "completed", ...dateFilter }
        }],
        group: ["Customer.id"],
        limit: limitNumber, offset, subQuery: false
    });

    const report = rows.map(c => ({
        companyName: c.companyName,
        total: `$${parseFloat(c.dataValues.total || 0).toFixed(2)}`,
    }));

    return successResponse({ res, message: "Sales by customer report fetched", data: getPaginationData(rows.length, report, pageNumber, limitNumber), status: 200 });
});


const getProductWiseSalesSummary = asyncWrapper(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    let dateFilter = {};
    if (startDate) dateFilter.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) dateFilter.createdAt = { ...dateFilter.createdAt, [Op.lte]: new Date(endDate) };

    const { rows } = await Product.findAndCountAll({
        attributes: [
            "id", "name", "wholeSalePrice",
            [fn("SUM", col("orderItems.quantity")), "quantity"],
            [fn("SUM", literal("`orderItems`.`unitPrice` * `orderItems`.`quantity`")), "amount"],
            [fn("AVG", col("orderItems.unitPrice")), "avgPrice"],
        ],
        include: [{
            model: OrderItem, as: "orderItems", attributes: [], required: false,
            include: [{
                model: Order, as: "order", attributes: [], required: false,
                where: { status: "completed", ...dateFilter }
            }]
        }],
        group: ["Product.id"],
        limit: limitNumber, offset, subQuery: false
    });


    const totalAmount = rows.reduce((sum, p) => sum + parseFloat(p.dataValues.amount || 0), 0);

    const report = rows.map(p => {
        const amount = parseFloat(p.dataValues.amount || 0);
        const quantity = parseInt(p.dataValues.quantity) || 0;
        const avgPrice = parseFloat(p.dataValues.avgPrice || 0);
        const cogs = parseFloat(p.wholeSalePrice || 0) * quantity;
        const grossMargin = amount - cogs;
        const grossMarginPct = amount > 0 ? ((grossMargin / amount) * 100).toFixed(2) : "0.00";
        const salesPct = totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(2) : "0.00";

        return {
            productName: p.name,
            quantity,
            amount: `$${amount.toFixed(2)}`,
            percentOfSales: `${salesPct}%`,
            avgPrice: `$${avgPrice.toFixed(2)}`,
            cogs: `$${cogs.toFixed(2)}`,
            grossMargin: `$${grossMargin.toFixed(2)}`,
            grossMarginPercent: `${grossMarginPct}%`,
        };
    });

    return successResponse({ res, message: "Product wise sales summary fetched", data: getPaginationData(rows.length, report, pageNumber, limitNumber), status: 200 });
});

module.exports = {
    getPartnerProfitsReport,
    getPartnerCreditLimitReport,
    getUnpaidPartnerBalanceReport,
    getProductSalesReport,
    getCustomerReport,
    getDirectPartnerReport,
    getSalesByCustomerReport,
    getProductWiseSalesSummary,
};