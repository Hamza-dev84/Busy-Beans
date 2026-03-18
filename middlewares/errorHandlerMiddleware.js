
const errorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode || 500).json({status: "Fail", message: err.message || "Internal Server Error"});
}

module.exports = errorHandler;