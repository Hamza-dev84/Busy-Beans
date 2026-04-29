
const nodemailer = require("nodemailer");
const { orderConfirmationTemplate } = require("../templates/orderConfirmation");
const { invoiceTemplate } = require("../templates/invoiceTemplate");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendOrderConfirmationEmail = async (order) => {
    await transporter.sendMail({
        from: `"Busy Beans Coffee ☕" <${process.env.EMAIL_USER}>`,
        to: order.customerEmail,
        subject: `Order Confirmed! #${order.orderId} — Busy Beans Coffee`,
        html: orderConfirmationTemplate(order),
    });
};

const sendInvoiceEmail = async (toEmail, invoice, items) => {
    await transporter.sendMail({
        from: `"Busy Beans Coffee ☕" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Invoice #${invoice.invoiceNumber} — Busy Beans Coffee`,
        html: invoiceTemplate(invoice, items),
    });
};

module.exports = { sendOrderConfirmationEmail, sendInvoiceEmail };