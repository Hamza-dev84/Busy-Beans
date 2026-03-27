

const Customer = require("../models/customer")
const generateToken = require("../utilities/generateToken");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");


const register = asyncWrapper(async (req, res) => {
    const {
        addressLine1, addressLine2, country, state, city, zipCode,
        billingSameAsShipping, billingAddress, billingCountry, billingState, billingCity, billingZipCode,

        companyName, phoneCode, phone, saleTaxNumber, dispatchEmail, invoiceEmail,

        userName, email, password, confirmPassword,
    } = req.body;


    if (password != confirmPassword) {
        return errorResponse({ res, message: "Password do not match", status: 401 });
    }

    const existing = await Customer.findOne({ where: { email } });
    if (existing) return errorResponse({ res, message: "email already exist", status: 401 });

    const customer = await Customer.create({
        addressLine1, addressLine2, country, state, city, zipCode,
        billingSameAsShipping: billingSameAsShipping ?? true, 
        billingAddress: billingSameAsShipping ? addressLine1 : billingAddress, 
        billingCountry: billingSameAsShipping ? country : billingCountry, 
        billingState: billingSameAsShipping ? state : billingState, 
        billingCity: billingSameAsShipping ? city : billingCity,
        billingZipCode: billingSameAsShipping ? zipCode : billingZipCode,

        companyName, 
        phoneCode: phoneCode || "+1", phone, saleTaxNumber, dispatchEmail, invoiceEmail,

        userName, email, password, confirmPassword,
    });

    const token = generateToken(customer);

    return successResponse({
        res,
        data: { customer, token },
        message: "Customer registered successfuly",
        status: 201
    });
})

const login = asyncWrapper(async (req, res) => {

    const { email, password } = req.body;

    const customer = await Customer.findOne({ where: { email } });
    if (!customer) return errorResponse({ res, message: "Invalid email or password", status: 401 });

    const isMatch = customer.comparePassword(password);
    if (!isMatch) return errorResponse({ res, message: "Invalid email or password", status: 401 });

    const token = generateToken(customer);

    return successResponse({ res, data: { customer, token }, message: "Login successfuly", status: 201 })

})

module.exports = { register, login }