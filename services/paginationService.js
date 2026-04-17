
const getPagination = (page, limit) => {
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;
    return { pageNumber, limitNumber, offset };
};

const getPaginationData = (count, rows, pageNumber, limitNumber) => ({
    orders: rows,
    pagination: {
        totalOrders: count,
        totalPages: Math.ceil(count / limitNumber),
        currentPage: pageNumber,
        limit: limitNumber,
    }
});

module.exports = { getPagination, getPaginationData };