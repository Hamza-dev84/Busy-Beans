
// ab next api create krni ha Sales by Customer Summary Report jis mein company name aur total show krwana ha 

// ab next jo api create krni ha wo ha Product wise sales summary jis mein product name, quantity, amount, %of sales, avg price, COGS, Gross margin, Gross margin % show krwana ha

// like is tra bnana ha:
// const getPartnerProfitsReport = asyncWrapper(async (req, res) => {
//     const { startDate, endDate, page = 1, limit = 10 } = req.query;

//     let dateFilter = {};
//     if (startDate || endDate) {
//         dateFilter.createdAt = {};
//         if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
//         if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
//     }

//     const { pageNumber, limitNumber, offset } = getPagination(page, limit);

//     const { count, rows } = await LocalPartner.findAndCountAll({
//         attributes: [
//             "id",
//             "name",
//             "email",

//             [fn("COUNT", col("orders.id")), "ordersPlaced"],
//             [fn("SUM", col("orders.profit.orderTotal")), "totalSales"],
//             [fn("SUM", col("orders.profit.wholeSaleTotal")), "wholeSaleCost"],
//             [fn("SUM", col("orders.profit.partnerProfit")), "totalPartnerProfit"],
//             [fn("SUM", col("orders.profit.adminReceives")), "adminReceives"],
//         ],

//         include: [
//             {
//                 model: Order,
//                 as: "orders",
//                 attributes: [],
//                 required: false,
//                 where: {
//                     isLocalPartner: true,
//                     customerId: { [Op.ne]: null },
//                     ...dateFilter
//                 },
//                 include: [
//                     {
//                         model: OrderProfit,
//                         as: "profit",
//                         attributes: [],
//                         required: false
//                     }
//                 ]
//             }
//         ],

//         group: ["id"],

//         limit: limitNumber,
//         offset: offset,
//         subQuery: false
//     });

//     const totalCount = rows.length;

//     const report = rows.map(p => ({
//         partnerId: p.id,
//         partnerName: p.name,
//         partnerEmail: p.email,
//         ordersPlaced: p.dataValues.ordersPlaced || 0,
//         totalSales: `$${parseFloat(p.dataValues.totalSales || 0).toFixed(2)}`,
//         wholeSaleCost: `$${parseFloat(p.dataValues.wholeSaleCost || 0).toFixed(2)}`,
//         totalPartnerProfit: `$${parseFloat(p.dataValues.totalPartnerProfit || 0).toFixed(2)}`,
//         adminReceives: `$${parseFloat(p.dataValues.adminReceives || 0).toFixed(2)}`
//     }));

//     const pagination = getPaginationData(totalCount, report, pageNumber, limitNumber);

//     return successResponse({
//         res,
//         message: "Partner profit report fetched successfully",
//         data: pagination,
//         status: 200
//     });
// });

// ye sb apis aik hi file mein create krni ha reportController mein