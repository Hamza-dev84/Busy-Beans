

// const { getPagination, getPaginationMeta } = require("../services/paginationService");

// const getAllOrders = asyncWrapper(async (req, res) => {
//     const {
//         customerId,
//         supplierId,
//         localPartnerId,
//         currentStatus,
//         status,
//         isLocalPartner,
//         paymentMethod,
//         orderFrequency,
//         page,
//         limit
//     } = req.query;

//     let filter = {};

    
//     if (currentStatus) {
//         const validCurrentStatuses = [
//             "order_placed",
//             "dispatched_to_supplier",
//             "supplier_acknowledged",
//             "shipped",
//             "cancelled"
//         ];

//         const normalized = currentStatus.toLowerCase();
//         if (!validCurrentStatuses.includes(normalized)) {
//             return errorResponse({ res, message: "Invalid currentStatus", status: 400 });
//         }
//         filter.currentStatus = normalized;
//     }

//     if (status) {
//         const validStatuses = ["pending", "completed", "cancelled"];
//         const normalized = status.toLowerCase();
//         if (!validStatuses.includes(normalized)) {
//             return errorResponse({ res, message: "Invalid status", status: 400 });
//         }
//         filter.status = normalized;
//     }

    
//     if (customerId) filter.customerId = customerId;
//     if (supplierId) filter.supplierId = supplierId;
//     if (localPartnerId) filter.localPartnerId = localPartnerId;

//     if (isLocalPartner !== undefined) {
//         filter.isLocalPartner = isLocalPartner === "true";
//     }

//     if (paymentMethod) filter.paymentMethod = paymentMethod;
//     if (orderFrequency) filter.orderFrequency = orderFrequency;

    
//     const { pageNumber, limitNumber, offset } = getPagination(page, limit);

//     const { count, rows } = await Order.findAndCountAll({
//         where: filter,
//         include: [
//             {
//                 model: OrderItem,
//                 as: "items",
//                 include: [{ model: Product, as: "product" }]
//             }
//         ],
//         order: [["createdAt", "DESC"]],
//         limit: limitNumber,
//         offset: offset,
//         distinct: true
//     });

    
//     const pagination = getPaginationMeta(count, pageNumber, limitNumber);

//     return successResponse({
//         res,
//         message: "Orders fetched successfully",
//         data: {
//             orders: rows,
//             pagination
//         },
//         status: 200
//     });
// });

// const { getPagination, getPaginationMeta } = require("../services/paginationService");

// const getPartnerOrders = asyncWrapper(async (req, res) => {
//     const {
//         supplierId,
//         localPartnerId,
//         currentStatus,
//         status,
//         paymentMethod,
//         orderFrequency,
//         page,
//         limit
//     } = req.query;

//     let filter = {
//         isLocalPartner: true,
//         customerId: null
//     };

    
//     if (currentStatus) {
//         const validCurrentStatuses = [
//             "order_placed",
//             "dispatched_to_supplier",
//             "supplier_acknowledged",
//             "shipped",
//             "cancelled"
//         ];

//         const normalized = currentStatus.toLowerCase();
//         if (!validCurrentStatuses.includes(normalized)) {
//             return errorResponse({ res, message: "Invalid current status", status: 400 });
//         }
//         filter.currentStatus = normalized;
//     }

    
//     if (status) {
//         const validStatuses = ["pending", "completed", "cancelled"];
//         const normalized = status.toLowerCase();

//         if (!validStatuses.includes(normalized)) {
//             return errorResponse({ res, message: "Invalid status", status: 400 });
//         }

//         filter.status = normalized;
//     }

    
//     if (supplierId) filter.supplierId = supplierId;
//     if (localPartnerId) filter.localPartnerId = localPartnerId;
//     if (paymentMethod) filter.paymentMethod = paymentMethod;
//     if (orderFrequency) filter.orderFrequency = orderFrequency;

    
//     const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    
//     const { count, rows } = await Order.findAndCountAll({
//         where: filter,
//         include: [
//             {
//                 model: OrderItem,
//                 as: "items",
//                 include: [{ model: Product, as: "product" }]
//             }
//         ],
//         limit: limitNumber,
//         offset: offset,
//         distinct: true
//     });

//     const pagination = getPaginationMeta(count, pageNumber, limitNumber);

//     return successResponse({
//         res,
//         message: "Partner orders fetched successfully",
//         data: {
//             orders: rows,
//             pagination
//         },
//         status: 200
//     });
// });






// const getAllOrders = asyncWrapper(async (req, res) => {
//     const { customerId, supplierId, localPartnerId, currentStatus, status, isLocalPartner,
//         paymentMethod, orderFrequency, page = 1, limit = 10 } = req.query;
//     let filter = {};
//     if (currentStatus) {
//         const validCurrentStatuses = [
//             "order_placed",
//             "dispatched_to_supplier",
//             "supplier_acknowledged",
//             "shipped",
//             "cancelled"
//         ]

//         const normalized = currentStatus.toLowerCase();
//         if (!validCurrentStatuses.includes(normalized)) {
//             return errorResponse({ res, message: "Invalid currentStatus", status: 401 });
//         }
//         filter.currentStatus = normalized;
//     }

//     if (status) {
//         const validStatuses = ["pending", "completed", "cancelled"];
//         const normalized = status.toLowerCase();
//         if (!validStatuses.includes(normalized)) {
//             return errorResponse({ res, message: "Invalid status", status: 400 });
//         }
//         filter.status = normalized;
//     }

//     if (customerId) filter.customerId = customerId;
//     if (supplierId) filter.supplierId = supplierId;
//     if (localPartnerId) filter.localPartnerId = localPartnerId;

//     if (isLocalPartner !== undefined) {
//         filter.isLocalPartner = isLocalPartner === "true";
//     }

//     if (paymentMethod) filter.paymentMethod = paymentMethod;
//     if (orderFrequency) filter.orderFrequency = orderFrequency;

//     const {pageNumber, limitNumber, offset} = getPagination(page, limit);
//     const { count, rows } = await Order.findAndCountAll({
//         where: filter,
//         include: [
//             { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] }
//         ],
//         limit: limitNumber,
//         offset: offset,
//         distinct: true
//     })

//     const pagination = getPaginationMeta(count, pageNumber, limitNumber)

//     return successResponse({
//         res, 
//         data: {
//             orders: rows,
//             pagination
//         },
//         message: "Orders fetched successfuly",
//         status: 200
//     })
// })

// const getPartnerOrders = asyncWrapper(async (req, res) => {
//     const { supplierId, localPartnerId, currentStatus, status,
//         paymentMethod, orderFrequency, page = 1, limit = 10 } = req.query;
//     let filter = {
//         isLocalPartner: true,
//         customerId: null
//     };
//     if (currentStatus) {
//         const validCurrentStatuses = [
//             "order_placed",
//             "dispatched_to_supplier",
//             "supplier_acknowledged",
//             "shipped",
//             "cancelled"
//         ]
//         const normalized = currentStatus.toLowerCase();
//         if (!validCurrentStatuses.includes(normalized)) {
//             return errorResponse({ res, message: "Invalid current status", status: 400 });
//         }
//         filter.currentStatus = normalized;
//     }

//     if (status) {
//         const validStatuses = ["pending", "completed", "cancelled"];
//         const normalized = status.toLowerCase(status);
//         if (!validStatuses.includes(normalized)) {
//             return errorResponse({ res, message: "Invalid status", status: 400 });
//         }
//     }
//     if (supplierId) filter.supplierId = supplierId;
//     if (localPartnerId) filter.localPartnerId = localPartnerId;
//     if (paymentMethod) filter.paymentMethod = paymentMethod;
//     if (orderFrequency) filter.orderFrequency = orderFrequency;

//     const pageNumber = parseInt(page);
//     const limitNumber = parseInt(limit);
//     const offset = (pageNumber - 1) * limitNumber;

//     const {count, rows} = await Order.findAndCountAll({
//         where: filter,
//         include: [{
//             model: OrderItem, as: "items", include: [{ model: Product, as: "product" }],
//         }],
//         limit: limitNumber,
//         offset: offset,
//         distinct: true
//     })

//     return successResponse({
//         res, 
//         message: "Orders fetched successfuly",
//         data: {
//             orders: rows, 
//             pagination: {
//                 totalOrders: count,
//                 totalPages: Math.ceil(count / limitNumber),
//                 currentPage: pageNumber,
//                 limit: limitNumber
//             }
//         },
//         status: 200
//     })

// })