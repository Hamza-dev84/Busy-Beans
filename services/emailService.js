
const nodemailer = require("nodemailer");
const { orderConfirmationTemplate } = require("../templates/orderConfirmation");
const { dispatchTemplate, dispatchedToCustomerTemplate } = require("../templates/dispatchTemplate");
const { shippedTemplate } = require("../templates/shippedTemplates");
const {invoiceTemplate} = require("../templates/invoiceTemplate");

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

const sendDispatchedToCustomerEmail = async (toEmail, name, order) => {
    await transporter.sendMail({
        from: `"Busy Beans Coffee" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Your Order #${order.id} Is On Its Way — Busy Beans Coffee`,
        html: dispatchedToCustomerTemplate(name, order),
    });
};

const sendShippedEmail = async (toEmail, customerName, order) => {
    await transporter.sendMail({
        from: `"Busy Beans Coffee" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Your Order #${order.id} Has Been Shipped — Busy Beans Coffee`,
        html: shippedTemplate(customerName, order),
    });
};

const sendInvoiceEmail = async (toEmail, invoice, items) => {
    await transporter.sendMail({
        from: `"Busy Beans Coffee" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Invoice #${invoice.invoiceNumber} — Busy Beans Coffee`,
        html: invoiceTemplate(invoice, items),
    });
};

module.exports = {
    sendOrderConfirmationEmail, sendDispatchEmail, 
    sendShippedEmail, sendDispatchedToCustomerEmail,
    sendInvoiceEmail
}