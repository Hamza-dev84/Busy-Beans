
const nodemailer = require("nodemailer");
const { orderConfirmationTemplate } = require("../templates/orderConfirmation");
const { dispatchTemplate } = require("../templates/dispatchTemplate");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

const sendOrderConfirmationEmail = async (order) => {
    await transporter.sendMail({
        from: `"Busy beans coffee" <${process.env.EMAIL_USER}>`,
        to: order.customerEmail,
        subject: `Order Confirmed! #${order.orderId} — Busy Beans Coffee`,
        html: orderConfirmationTemplate(order),
    })
}

const sendDispatchEmail = async (toEmail, supplierName, order) => {
    await transporter.sendMail({
        from: `"Busy Beans Coffee" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `New Order Dispatched #${order.id} — Busy Beans Coffee`,
        html: dispatchTemplate(supplierName, order),
    });
};

module.exports = { sendOrderConfirmationEmail, sendDispatchEmail }