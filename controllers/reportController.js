
const { Order, OrderProfit, LocalPartner, Product, OrderItem, Customer } = require("../models/index");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");
const { Op, fn, col, literal } = require("sequelize");
const { getPagination, getPaginationData } = require("../services/paginationService");

const getPartnerProfitsReport = asyncWrapper(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
        if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    const { count, rows } = await LocalPartner.findAndCountAll({
        attributes: [
            "id",
            "name",
            "email",

            [fn("COUNT", col("orders.id")), "ordersPlaced"],
            [fn("SUM", col("orders.profit.orderTotal")), "totalSales"],
            [fn("SUM", col("orders.profit.wholeSaleTotal")), "wholeSaleCost"],
            [fn("SUM", col("orders.profit.partnerProfit")), "totalPartnerProfit"],
            [fn("SUM", col("orders.profit.adminReceives")), "adminReceives"],
        ],

        include: [
            {
                model: Order,
                as: "orders",
                attributes: [],
                required: false,
                where: {
                    isLocalPartner: true,
                    customerId: { [Op.ne]: null },
                    ...dateFilter
                },
                include: [
                    {
                        model: OrderProfit,
                        as: "profit",
                        attributes: [],
                        required: false
                    }
                ]
            }
        ],

        group: ["id"],

        limit: limitNumber,
        offset: offset,
        subQuery: false
    });

    const report = rows.map(p => ({
        partnerId: p.id,
        partnerName: p.name,
        partnerEmail: p.email,
        ordersPlaced: p.dataValues.ordersPlaced || 0,
        totalSales: `$${parseFloat(p.dataValues.totalSales || 0).toFixed(2)}`,
        wholeSaleCost: `$${parseFloat(p.dataValues.wholeSaleCost || 0).toFixed(2)}`,
        totalPartnerProfit: `$${parseFloat(p.dataValues.totalPartnerProfit || 0).toFixed(2)}`,
        adminReceives: `$${parseFloat(p.dataValues.adminReceives || 0).toFixed(2)}`
    }));

    return successResponse({
        res,
        message: "Partner profit report fetched successfully",
        data: getPaginationData(count.length, report, pageNumber, limitNumber),
        status: 200
    });
});

const getPartnerCreditReport = asyncWrapper(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
        if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    const { count, rows } = await LocalPartner.findAndCountAll({
        attributes: [
            "id",
            "name",
            "creditLimit",

            [fn("SUM", col("orders.total")), "creditUsed"]
        ],

        include: [
            {
                model: Order,
                as: "orders",
                attributes: [],
                required: false,
                where: {
                    status: {
                        [Op.ne]: "completed"
                    },
                    ...dateFilter
                }
            }
        ],

        group: ["id"],

        limit: limitNumber,
        offset: offset,
        subQuery: false
    });


    const report = rows.map(p => {
        const creditLimit = parseFloat(p.creditLimit || 0);
        const creditUsed = parseFloat(p.dataValues.creditUsed || 0);

        const utilization = creditLimit > 0
            ? ((creditUsed / creditLimit) * 100).toFixed(2)
            : 0;

        return {
            partnerId: p.id,
            partnerName: p.name,
            creditLimit: `$${creditLimit.toFixed(2)}`,
            creditUsed: `$${creditUsed.toFixed(2)}`,
            creditUtilization: `${utilization}%`
        };
    });

    return successResponse({
        res,
        message: "Partner credit report fetched successfully",
        data: getPaginationData(count.length, report, pageNumber, limitNumber),
        status: 200
    });

});

const getUnpaidPartnerBalanceReport = asyncWrapper(async (req, res) => {
    const { type, startDate, endDate, page = 1, limit = 10 } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
        if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    const { pageNumber, limitNumber, offset } = getPagination(page, limit);


    if (type === "dropship") {

        const { count, rows } = await LocalPartner.findAndCountAll({
            attributes: [
                "id",
                "name",
                [literal(`'DropShip'`), "partnerType"],

                [fn("SUM", col("orders.total")), "outstandingBalance"],
                [fn("COUNT", col("orders.id")), "ordersOnCredit"]
            ],

            include: [
                {
                    model: Order,
                    as: "orders",
                    attributes: [],
                    required: false,
                    where: {
                        isLocalPartner: true,
                        status: { [Op.ne]: "completed" },
                        ...dateFilter
                    }
                }
            ],

            group: ["id"],
            limit: limitNumber,
            offset: offset,
            subQuery: false
        });

        const report = rows.map(p => ({
            partnerType: p.dataValues.partnerType,
            partnerName: p.name,
            outstandingBalance: `$${parseFloat(p.dataValues.outstandingBalance || 0).toFixed(2)}`,
            ordersOnCredit: p.dataValues.ordersOnCredit || 0
        }));

        return successResponse({
            res,
            message: "DropShip unpaid balance report",
            data: getPaginationData(count.length, report, pageNumber, limitNumber),
            status: 200
        });
    }

    if (type === "direct") {

        const { count, rows } = await LocalPartner.findAndCountAll({
            attributes: [
                "id",
                "name",

                [fn("SUM", col("orders.total")), "outstandingBalance"],
                [fn("COUNT", col("orders.id")), "ordersOnCredit"],
                [fn("SUM", literal(`CASE WHEN orders.customerId IS NULL THEN 1 ELSE 0 END`)), "partnerOrders"],
                [fn("SUM", literal(`CASE WHEN orders.customerId IS NOT NULL THEN 1 ELSE 0 END`)), "customerOrders"],
                [fn("SUM", literal(`CASE WHEN orders.customerId IS NULL THEN orders.total ELSE 0 END`)), "creditOnPartnerOrders"],
                [fn("SUM", literal(`CASE WHEN orders.customerId IS NOT NULL THEN orders.total ELSE 0 END`)), "creditOnCustomerOrders"],
            ],

            include: [
                {
                    model: Order,
                    as: "orders",
                    attributes: [],
                    required: false,
                    where: {
                        status: { [Op.ne]: "completed" },
                        ...dateFilter
                    }
                }
            ],

            group: ["id"],
            limit: limitNumber,
            offset: offset,
            subQuery: false
        });

        const report = rows.map(p => ({
            partnerName: p.name,
            outstandingBalance: `$${parseFloat(p.dataValues.outstandingBalance || 0).toFixed(2)}`,
            ordersOnCredit: p.dataValues.ordersOnCredit || 0,
            partnerOrders: p.dataValues.partnerOrders || 0,
            customerOrders: p.dataValues.customerOrders || 0,
            creditOnPartnerOrders: `$${parseFloat(p.dataValues.creditOnPartnerOrders || 0).toFixed(2)}`,
            creditOnCustomerOrders: `$${parseFloat(p.dataValues.creditOnCustomerOrders || 0).toFixed(2)}`
        }));

        return successResponse({
            res,
            message: "Direct partner unpaid balance report",
            data: getPaginationData(count.length, report, pageNumber, limitNumber),
            status: 200
        });
    }

    return errorResponse({
        res,
        message: "Invalid type. Use 'dropship' or 'direct'",
        status: 400
    });
});

const getProductSalesReport = asyncWrapper(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
        if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    const { count, rows } = await Product.findAndCountAll({
        attributes: [
            "id",
            "name",

            [fn("COALESCE", fn("SUM", col("orderItems.total")), 0), "revenue"],

            [fn("SUM", literal(`CASE WHEN \`orderItems->order\`.\`customerId\` IS NOT NULL THEN \`orderItems\`.\`total\` ELSE 0 END`)), "revenueFromCustomerOrders"],

            [fn("SUM", literal(`CASE WHEN \`orderItems->order\`.\`customerId\` IS NULL THEN \`orderItems\`.\`total\` ELSE 0 END`)), "revenueFromPartnerSelfOrders"],

            [fn("COALESCE", fn("SUM", col("orderItems.quantity")), 0), "unitsSold"],

            [fn("SUM", literal(`CASE WHEN \`orderItems->order\`.\`customerId\` IS NOT NULL THEN \`orderItems\`.\`quantity\`ELSE 0 END`)), "unitsSoldToCustomers"],

            [fn("SUM", literal(`CASE WHEN \`orderItems->order\`.\`customerId\` IS NULL THEN \`orderItems\`.\`quantity\` ELSE 0 END`)), "unitsSoldToPartners"],

            [fn("SUM", literal(`CASE WHEN \`orderItems->order\`.\`customerId\` IS NOT NULL AND \`orderItems->order\`.\`isLocalPartner\` = true THEN COALESCE(\`orderItems->order->profit\`.\`adminReceives\`, 0)ELSE 0 END`)), "adminReceivableFromLocalPartner"],
        ],


        include: [
            {
                model: OrderItem,
                as: "orderItems",
                attributes: [],
                required: false,
                include: [
                    {
                        model: Order,
                        as: "order",
                        attributes: [],
                        required: false,
                        include: [
                            {
                                model: OrderProfit,
                                as: "profit",
                                attributes: [],
                                required: false,
                                where: {
                                    ...dateFilter
                                }
                            }
                        ]
                    }
                ]
            }
        ],

        group: ["Product.id"],
        limit: limitNumber,
        offset,
        subQuery: false
    });

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
        message: "Product sales report fetched successfully",
        data: getPaginationData(count.length, report, pageNumber, limitNumber),
        status: 200
    });
});

const getCustomerReport = asyncWrapper(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    let dateFilter = {};
    if (startDate) dateFilter.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) dateFilter.createdAt = { ...dateFilter.createdAt, [Op.lte]: new Date(endDate) }

    const { count, rows } = await Customer.findAndCountAll({
        attributes: [
            "id", "userName", "companyName", "email",
            [fn("COUNT", col("orders.id")), "numberOfOrders"],
            [fn("MAX", col("orders.createdAt")), "lastOrderDate"],
            [fn("SUM", literal("CASE WHEN `orders`.`status` = 'completed' THEN `orders`.`total` ELSE 0 END")), "totalSpent"],
            [fn("SUM", literal("CASE WHEN `orders`.`status` != 'completed' THEN `orders`.`total` ELSE 0 END")), "outstandingBalance"],
            [fn("AVG", literal("CASE WHEN `orders`.`status` = 'completed' THEN `orders`.`total` ELSE NULL END")), "avgSpent"],
        ],
        include: [{
            model: Order, as: "orders",
            required: false,
            attributes: [],
            where: dateFilter
        }],
        group: ["Customer.id"],
        limit: limitNumber,
        offset,
        subQuery: false
    })

    const report = rows.map(c => ({
        customerName: c.userName,
        companyName: c.companyName,
        numberOfOrders: parseInt(c.dataValues.numberOfOrders) || 0,
        lastOrderDate: c.dataValues.lastOrderDate || null,
        outstandingBalance: `$${parseFloat(c.dataValues.outstandingBalance || 0).toFixed(2)}`,
        avgSpent: `$${parseFloat(c.dataValues.avgSpent || 0).toFixed(2)}`,
        totalSpent: `$${parseFloat(c.dataValues.totalSpent || 0).toFixed(2)}`
    }))

    return successResponse({
        res,
        data: getPaginationData(count.length, report, pageNumber, limitNumber),
        message: "Customer report fetched",
        status: 201
    })
})

const getDirectPartnerReport = asyncWrapper(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
        if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    const { count, rows } = await LocalPartner.findAndCountAll({
        where: { partnerType: "Direct Partner" },
        attributes: [
            "id", "name",

            [fn("COUNT", col("orders.id")), "totalOrders"],

            [fn("SUM", literal(`CASE WHEN orders.customerId IS NOT NULL THEN 1 ELSE 0 END`)), "clientOrders"],

            [fn("SUM", literal(`CASE WHEN orders.customerId IS NULL THEN 1 ELSE 0 END`)), "selfOrders"]
        ],
        include: [{
            model: Order, as: "orders", attributes: [], required: false,
            where: {
                ...dateFilter
            }
        }],
        group: ["id"],
        limit: limitNumber, offset, subQuery: false
    });

    const report = rows.map(p => ({
        partnerName: p.name,
        territory: p.state,
        clientOrders: parseInt(p.dataValues.clientOrders || 0),
        selfOrders: parseInt(p.dataValues.selfOrders || 0),
        totalOrders: parseInt(p.dataValues.totalOrders || 0),
    }));

    return successResponse({
        res, message: "Direct partner report fetched", data: getPaginationData(count.length, report, pageNumber, limitNumber), status: 200
    });
});

const getSalesByCustomerSummaryReport = asyncWrapper(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
        if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    const { count, rows } = await Customer.findAndCountAll({
        attributes: [
            "id",
            "companyName",

            [fn("COUNT", col("orders.id")), "totalOrders"],

            [fn("SUM", literal(`CASE WHEN orders.status = 'completed' THEN orders.total ELSE 0 END`)), "totalSales"]],

        include: [
            {
                model: Order,
                as: "orders",
                attributes: [],
                required: false,
                where: {
                    ...dateFilter
                }
            }
        ],

        group: ["Customer.id"],
        limit: limitNumber,
        offset: offset,
        subQuery: false
    });

    const report = rows.map(c => ({
        companyName: c.companyName,

        totalOrders: parseInt(c.dataValues.totalOrders || 0),

        totalSales: `$${parseFloat(c.dataValues.totalSales || 0).toFixed(2)}`
    }));

    return successResponse({
        res,
        message: "Sales by customer summary fetched successfully",
        data: getPaginationData(count.length, report, pageNumber, limitNumber),
        status: 200
    });
});

const getProductWiseSalesSummary = asyncWrapper(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    let dateFilter = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
        if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
    }

    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    const { count, rows } = await Product.findAndCountAll({
        attributes: [
            "id",
            "name",

            [fn("COALESCE", fn("SUM", col("orderItems.quantity")), 0), "quantity"],
            [fn("COALESCE", fn("SUM", col("orderItems.total")), 0), "amount"],

            [fn("AVG", literal("CASE WHEN orderItems.quantity > 0 THEN orderItems.total / orderItems.quantity END")), "avgPrice"],

            [fn("COALESCE", fn("SUM", literal("orderItems.quantity * Product.price")), 0), "cogs"],
            [fn("COALESCE", fn("SUM", literal("orderItems.total - (orderItems.quantity * Product.price)")), 0), "grossMargin"]
        ],

        include: [
            {
                model: OrderItem,
                as: "orderItems",
                attributes: [],
                required: false,
                include: [
                    {
                        model: Order,
                        as: "order",
                        attributes: [],
                        required: false,
                        where: {
                            status: "completed",
                            ...dateFilter
                        }
                    }
                ]
            }
        ],

        group: ["Product.id"],
        limit: limitNumber,
        offset,
        subQuery: false
    })

    const totalSales = rows.reduce((sum, p) => sum + parseFloat(p.dataValues.amount || 0), 0);

    const report = rows.map(p => {
        const d = p.dataValues;
        const quantity = parseFloat(d.quantity || 0);
        const amount = parseFloat(d.amount || 0);
        const cogs = parseFloat(d.cogs || 0);
        const grossMargin = parseFloat(d.grossMargin || 0);

        const percentOfSales = totalSales > 0 ? ((amount / totalSales) * 100).toFixed(2) : 0;
        const grossMarginPercent = amount > 0 ? ((grossMargin / amount) * 100).toFixed(2) : 0;

        return {
            productName: p.name,
            quantity: parseFloat(quantity),
            amount: `$${amount.toFixed(2)}`,
            percentOfSales: `${percentOfSales} %`,
            avgPrice: `$${parseFloat(d.avgPrice || 0).toFixed(2)}`,
            COGS: `$${cogs.toFixed(2)}`,
            grossMargin: `$${grossMargin.toFixed(2)}`,
            grossMarginPercent: `${grossMarginPercent}%`

        }

    })

    return successResponse({
        res,
        data: getPaginationData(count.length, report, pageNumber, limitNumber),
        status: 200
    })
})


module.exports = {
    getPartnerProfitsReport,
    getPartnerCreditReport,
    getUnpaidPartnerBalanceReport,
    getProductSalesReport,
    getCustomerReport,
    getDirectPartnerReport,
    getSalesByCustomerSummaryReport,
    getProductWiseSalesSummary
};
