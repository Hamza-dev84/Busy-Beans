
const successResponse = ({res, data, message="Success", status=201}) => {
    return res.status(status).json({
        success: true,
        message: message,
        data: data
    });
}

const errorResponse = ({res, message="Fail", status=500}) => {
    res.status(status).json({
        success: false,
        message: message
    });
} 

module.exports = {
    successResponse,
    errorResponse
}