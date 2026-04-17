
// const getPagination = (page, limit) => {
//     const pageNumber = parseInt(page);
//     const limitNumber = parseInt(limit);
//     const offset = (pageNumber - 1) * limitNumber;

//     return { pageNumber, limitNumber, offset };
// }

// const getPaginationMeta = (count, pageNumber, limitNumber) => {
//     const totalPages = Math.ceil(count / limitNumber);

//     return{
//         totalRecords: count,
//         totalPages,
//         currentPage: pageNumber,
//         limit: limitNumber,
//         hasNextPage: pageNumber < totalPages,
//         hasPrevPage: pageNumber > 1
//     }
// }

// module.exports = {
//     getPagination, getPaginationMeta
// }