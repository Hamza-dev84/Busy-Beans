

const { Order, OrderProfit, LocalPartner, Product, OrderItem, Customer } = require("../models");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");
const { Op, fn, col, literal } = require("sequelize");
const { getPagination, getPaginationData } = require("../services/paginationService");


// ─────────────────────────────────────────────────────────────
// 1. PARTNER PROFITS REPORT
// ─────────────────────────────────────────────────────────────
const getPartnerProfitsReport = asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    const { count, rows } = await LocalPartner.findAndCountAll({
        attributes: [
            "id",
            "name",
            "email",
            [fn("COUNT", col("orders.id")), "ordersPlaced"],
            [fn("SUM", col("orders->profit.orderTotal")), "totalSales"],
            [fn("SUM", col("orders->profit.wholeSaleTotal")), "wholeSaleCost"],
            [fn("SUM", col("orders->profit.partnerProfit")), "totalPartnerProfit"],
            [fn("SUM", col("orders->profit.adminReceives")), "adminReceives"],
        ],
        include: [{
            model: Order,
            as: "orders",
            attributes: [],
            required: false,
            where: {
                isLocalPartner: true,
                customerId: { [Op.ne]: null }
            },
            include: [{
                model: OrderProfit,
                as: "profit",
                attributes: [],
                required: false
            }]
        }],
        group: ["LocalPartner.id"],
        limit: limitNumber,
        offset,
        subQuery: false
    });

    const totalCount = Array.isArray(count) ? count.length : count;

    const report = rows.map(p => ({
        partnerId: p.id,
        partnerName: p.name,
        partnerEmail: p.email,
        ordersPlaced: parseInt(p.dataValues.ordersPlaced || 0),
        totalSales: `$${parseFloat(p.dataValues.totalSales || 0).toFixed(2)}`,
        wholeSaleCost: `$${parseFloat(p.dataValues.wholeSaleCost || 0).toFixed(2)}`,
        totalPartnerProfit: `$${parseFloat(p.dataValues.totalPartnerProfit || 0).toFixed(2)}`,
        adminReceives: `$${parseFloat(p.dataValues.adminReceives || 0).toFixed(2)}`
    }));

    return successResponse({
        res,
        message: "Partner profit report fetched",
        data: getPaginationData(totalCount, report, pageNumber, limitNumber),
        status: 200
    });
});


// ─────────────────────────────────────────────────────────────
// 2. PARTNER CREDIT REPORT
// ─────────────────────────────────────────────────────────────
const getPartnerCreditReport = asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    const { count, rows } = await LocalPartner.findAndCountAll({
        attributes: [
            "id",
            "name",
            "creditLimit",
            [fn("SUM", col("orders.total")), "creditUsed"]
        ],
        include: [{
            model: Order,
            as: "orders",
            attributes: [],
            required: false,
            where: { status: { [Op.ne]: "completed" } }
        }],
        group: ["LocalPartner.id"],
        limit: limitNumber,
        offset,
        subQuery: false
    });

    const totalCount = Array.isArray(count) ? count.length : count;

    const report = rows.map(p => {
        const creditLimit = parseFloat(p.creditLimit || 0);
        const creditUsed = parseFloat(p.dataValues.creditUsed || 0);

        return {
            partnerId: p.id,
            partnerName: p.name,
            creditLimit: `$${creditLimit.toFixed(2)}`,
            creditUsed: `$${creditUsed.toFixed(2)}`,
            creditUtilization: creditLimit > 0
                ? `${((creditUsed / creditLimit) * 100).toFixed(2)}%`
                : "0%"
        };
    });

    return successResponse({
        res,
        message: "Partner credit report fetched",
        data: getPaginationData(totalCount, report, pageNumber, limitNumber),
        status: 200
    });
});


// ─────────────────────────────────────────────────────────────
// 3. UNPAID PARTNER BALANCE REPORT
// ─────────────────────────────────────────────────────────────
const getUnpaidPartnerBalanceReport = asyncWrapper(async (req, res) => {
    const { type, page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    if (!["dropship", "direct"].includes(type)) {
        return errorResponse({ res, message: "Invalid type", status: 400 });
    }

    const { count, rows } = await LocalPartner.findAndCountAll({
        attributes: [
            "id",
            "name",
            [fn("SUM", col("orders.total")), "outstandingBalance"],
            [fn("COUNT", col("orders.id")), "ordersOnCredit"]
        ],
        include: [{
            model: Order,
            as: "orders",
            attributes: [],
            required: false,
            where: { status: { [Op.ne]: "completed" } }
        }],
        group: ["LocalPartner.id"],
        limit: limitNumber,
        offset,
        subQuery: false
    });

    const totalCount = Array.isArray(count) ? count.length : count;

    const report = rows.map(p => ({
        partnerName: p.name,
        outstandingBalance: `$${parseFloat(p.dataValues.outstandingBalance || 0).toFixed(2)}`,
        ordersOnCredit: parseInt(p.dataValues.ordersOnCredit || 0)
    }));

    return successResponse({
        res,
        message: "Unpaid partner report",
        data: getPaginationData(totalCount, report, pageNumber, limitNumber),
        status: 200
    });
});


// ─────────────────────────────────────────────────────────────
// 4. PRODUCT SALES REPORT (FINAL FIXED)
// ─────────────────────────────────────────────────────────────
const getProductSalesReport = asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    const { count, rows } = await Product.findAndCountAll({
        attributes: [
            "id",
            "name",

            [fn("COALESCE", fn("SUM", col("orderItems.total")), 0), "revenue"],

            [fn("SUM", literal(`CASE WHEN \`orderItems->order\`.\`customerId\` IS NOT NULL THEN \`orderItems\`.\`total\` ELSE 0 END`)), "revenueFromCustomerOrders"],

            [fn("SUM", literal(`CASE WHEN \`orderItems->order\`.\`customerId\` IS NULL THEN \`orderItems\`.\`total\` ELSE 0 END`)), "revenueFromPartnerSelfOrders"],

            [fn("COALESCE", fn("SUM", col("orderItems.quantity")), 0), "unitsSold"],

            [fn("SUM", literal(`CASE WHEN \`orderItems->order\`.\`customerId\` IS NOT NULL THEN \`orderItems\`.\`quantity\` ELSE 0 END`)), "unitsSoldToCustomers"],

            [fn("SUM", literal(`CASE WHEN \`orderItems->order\`.\`customerId\` IS NULL THEN \`orderItems\`.\`quantity\` ELSE 0 END`)), "unitsSoldToPartners"],

            [fn("SUM", literal(`CASE WHEN \`orderItems->order\`.\`customerId\` IS NOT NULL AND \`orderItems->order\`.\`isLocalPartner\` = true THEN COALESCE(\`orderItems->order->profit\`.\`adminReceives\`, 0) ELSE 0 END`)), "adminReceivableFromLocalPartner"]
        ],

        include: [{
            model: OrderItem,
            as: "orderItems",
            attributes: [],
            required: false,
            include: [{
                model: Order,
                as: "order",
                attributes: [],
                required: false,
                include: [{
                    model: OrderProfit,
                    as: "profit",
                    attributes: [],
                    required: false
                }]
            }]
        }],

        group: ["Product.id"],
        limit: limitNumber,
        offset,
        subQuery: false
    });

    const totalCount = Array.isArray(count) ? count.length : count;

    const report = rows.map(p => {
        const d = p.dataValues;

        return {
            productId: p.id,
            productName: p.name,
            revenue: `$${parseFloat(d.revenue || 0).toFixed(2)}`,
            revenueFromCustomerOrders: `$${parseFloat(d.revenueFromCustomerOrders || 0).toFixed(2)}`,
            revenueFromPartnerSelfOrders: `$${parseFloat(d.revenueFromPartnerSelfOrders || 0).toFixed(2)}`,
            unitsSold: parseInt(d.unitsSold || 0),
            unitsSoldToCustomers: parseInt(d.unitsSoldToCustomers || 0),
            unitsSoldToPartners: parseInt(d.unitsSoldToPartners || 0),
            adminReceivableFromLocalPartner: `$${parseFloat(d.adminReceivableFromLocalPartner || 0).toFixed(2)}`
        };
    });

    return successResponse({
        res,
        message: "Product sales report fetched",
        data: getPaginationData(totalCount, report, pageNumber, limitNumber),
        status: 200
    });
});


// ─────────────────────────────────────────────────────────────
// 5. CUSTOMER REPORT
// ─────────────────────────────────────────────────────────────
const getCustomerReport = asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    const { count, rows } = await Customer.findAndCountAll({
        attributes: [
            "id",
            "userName",
            "companyName",
            [fn("COUNT", col("orders.id")), "orders"],
            [fn("SUM", col("orders.total")), "totalSpent"]
        ],
        include: [{
            model: Order,
            as: "orders",
            attributes: [],
            required: false
        }],
        group: ["Customer.id"],
        limit: limitNumber,
        offset,
        subQuery: false
    });

    const totalCount = Array.isArray(count) ? count.length : count;

    const report = rows.map(c => ({
        customerName: c.userName,
        companyName: c.companyName,
        totalOrders: parseInt(c.dataValues.orders || 0),
        totalSpent: `$${parseFloat(c.dataValues.totalSpent || 0).toFixed(2)}`
    }));

    return successResponse({
        res,
        message: "Customer report fetched",
        data: getPaginationData(totalCount, report, pageNumber, limitNumber),
        status: 200
    });
});


// ─────────────────────────────────────────────────────────────
// 6. DIRECT PARTNER REPORT (FIXED)
// ─────────────────────────────────────────────────────────────
const getDirectPartnerReport = asyncWrapper(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    const { count, rows } = await LocalPartner.findAndCountAll({
        where: { partnerType: "direct" },

        attributes: [
            "id",
            "name",
            "state",

            [fn("COUNT", col("orders.id")), "totalOrders"],

            [fn("SUM", literal(`CASE WHEN orders.customerId IS NOT NULL THEN 1 ELSE 0 END`)), "clientOrders"],

            [fn("SUM", literal(`CASE WHEN orders.customerId IS NULL THEN 1 ELSE 0 END`)), "selfOrders"]
        ],

        include: [{
            model: Order,
            as: "orders",
            attributes: [],
            required: false
        }],

        group: ["LocalPartner.id"],
        limit: limitNumber,
        offset,
        subQuery: false
    });

    const totalCount = Array.isArray(count) ? count.length : count;

    const report = rows.map(p => ({
        partnerName: p.name,
        territory: p.state,
        clientOrders: parseInt(p.dataValues.clientOrders || 0),
        selfOrders: parseInt(p.dataValues.selfOrders || 0),
        totalOrders: parseInt(p.dataValues.totalOrders || 0)
    }));

    return successResponse({
        res,
        message: "Direct partner report fetched",
        data: getPaginationData(totalCount, report, pageNumber, limitNumber),
        status: 200
    });
});


module.exports = {
    getPartnerProfitsReport,
    getPartnerCreditReport,
    getUnpaidPartnerBalanceReport,
    getProductSalesReport,
    getCustomerReport,
    getDirectPartnerReport
};