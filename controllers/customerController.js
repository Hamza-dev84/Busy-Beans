

const Customer = require("../models/Customer")
const generateToken = require("../utilities/generateToken");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");
const { LocalPartner } = require("../models");


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

    const localPartner = await LocalPartner.findOne({
        where: { shippingState: state, status: "active" }
    });

    const isSame = billingSameAsShipping === "true" || billingSameAsShipping === true;

    const customer = await Customer.create({
        addressLine1, addressLine2, country, state, city, zipCode,
        billingSameAsShipping: isSame,
        billingAddress: isSame ? addressLine1 : billingAddress,
        billingCountry: isSame ? country : billingCountry,
        billingState: isSame ? state : billingState,
        billingCity: isSame ? city : billingCity,
        billingZipCode: isSame ? zipCode : billingZipCode,

        companyName,
        phoneCode: phoneCode || "+1", phone, saleTaxNumber, dispatchEmail, invoiceEmail,

        userName, email, password,
        localPartnerId: localPartner ? localPartner.id : null
    });

    const token = generateToken(customer);

    return successResponse({
        res,
        data: {
            customer,
            assignedPartner: localPartner
                ? { id: localPartner.id, name: localPartner.name, state: localPartner.shippingState } :
                null
        },
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