const { LocalPartner, Order } = require("../models");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse } = require("../utilities/responseHandler");
const { fn, col, Op, literal } = require("sequelize");
const { getPagination, getPaginationData } = require("../services/paginationService");

const getUnpaidPartnerBalanceReport = asyncWrapper(async (req, res) => {
    const { type, page = 1, limit = 10 } = req.query;

    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    
    if (type === "dropship") {

        const partners = await LocalPartner.findAll({
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
                        status: { [Op.ne]: "completed" }
                    }
                }
            ],

            group: ["id"],
            limit: limitNumber,
            offset: offset,
            subQuery: false
        });

        const report = partners.map(p => ({
            partnerType: p.dataValues.partnerType,
            partnerName: p.name,
            outstandingBalance: `$${parseFloat(p.dataValues.outstandingBalance || 0).toFixed(2)}`,
            ordersOnCredit: p.dataValues.ordersOnCredit || 0
        }));

        const totalCount = partners.length;
        const pagination = getPaginationData(totalCount, report, pageNumber, limitNumber);

        return successResponse({
            res,
            message: "DropShip unpaid balance report",
            data: pagination,
            status: 200
        });
    }

    
    if (type === "direct") {

        const partners = await LocalPartner.findAll({
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
                        status: { [Op.ne]: "completed" }
                    }
                }
            ],

            group: ["id"],
            limit: limitNumber,
            offset: offset,
            subQuery: false
        });

        const report = partners.map(p => ({
            partnerName: p.name,
            outstandingBalance: `$${parseFloat(p.dataValues.outstandingBalance || 0).toFixed(2)}`,
            ordersOnCredit: p.dataValues.ordersOnCredit || 0,
            partnerOrders: p.dataValues.partnerOrders || 0,
            customerOrders: p.dataValues.customerOrders || 0,
            creditOnPartnerOrders: `$${parseFloat(p.dataValues.creditOnPartnerOrders || 0).toFixed(2)}`,
            creditOnCustomerOrders: `$${parseFloat(p.dataValues.creditOnCustomerOrders || 0).toFixed(2)}`
        }));

        const totalCount = partners.length;
        const pagination = getPaginationData(totalCount, report, pageNumber, limitNumber);

        return successResponse({
            res,
            message: "Direct partner unpaid balance report",
            data: pagination,
            status: 200
        });
    }

    return successResponse({
        res,
        message: "Invalid type. Use 'dropship' or 'direct'",
        data: [],
        status: 400
    });
});

module.exports = { getUnpaidPartnerBalanceReport };