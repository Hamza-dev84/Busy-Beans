
// const getDirectPartnerReport = asyncWrapper(async (req, res) => {
//     const { page = 1, limit = 10 } = req.query;
//     const { pageNumber, limitNumber, offset } = getPagination(page, limit);

//     const { count, rows } = await LocalPartner.findAndCountAll({
//         where: { partnerType: "direct" },

//         attributes: [
//             "id",
//             "name",
//             "state",

//             [fn("COUNT", col("orders.id")), "totalOrders"],

//             // ✅ FIXED (SUM instead of COUNT)
//             [
//                 fn("SUM",
//                     literal(`CASE WHEN orders.customerId IS NOT NULL THEN 1 ELSE 0 END`)
//                 ),
//                 "clientOrders"
//             ],

//             [
//                 fn("SUM",
//                     literal(`CASE WHEN orders.customerId IS NULL THEN 1 ELSE 0 END`)
//                 ),
//                 "selfOrders"
//             ]
//         ],

//         include: [
//             {
//                 model: Order,
//                 as: "orders",
//                 attributes: [],
//                 required: false   // ⚠️ VERY IMPORTANT
//             }
//         ],

//         group: ["LocalPartner.id"],

//         limit: limitNumber,
//         offset,
//         subQuery: false,
//         distinct: true
//     });

//     const totalCount = Array.isArray(count) ? count.length : count;

//     const report = rows.map(p => ({
//         partnerName: p.name,
//         territory: p.state,
//         clientOrders: parseInt(p.dataValues.clientOrders || 0),
//         selfOrders: parseInt(p.dataValues.selfOrders || 0),
//         totalOrders: parseInt(p.dataValues.totalOrders || 0),
//     }));

//     return successResponse({
//         res,
//         message: "Direct partner report fetched successfully",
//         data: getPaginationData(totalCount, report, pageNumber, limitNumber),
//         status: 200
//     });
// });






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
