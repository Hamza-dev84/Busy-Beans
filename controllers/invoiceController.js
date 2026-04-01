const { Invoice, InvoiceItem } = require("../models/index");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");
const nodemailer = require("nodemailer");

const sendInvoiceEmail = async (toEmail, invoice) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: `Invoice ${invoice.invoiceNumber} - Busy Bean Coffee`,
    text: `
Invoice Number: ${invoice.invoiceNumber}
Company: ${invoice.companyName}
Invoice Date: ${invoice.invoiceDate}
Amount: $${invoice.totalUSD}
Shipping Charges: $${invoice.shippingCharges}
Terms: ${invoice.days} days
Comments: ${invoice.comments || "N/A"}

Thank you for your business!
Busy Bean Coffee
    `,
  });
};

const createInvoice = asyncWrapper(async (req, res) => {
  const {
    companyName, email, address, paymentMethod,
    noteForSupplier, purchaseOrderNumber,
    invoiceNumber, PO_number, invoiceDate, days,
    items, shippingCharges, comments, emailToCustomer,
  } = req.body;

  let totalUSD = 0;
  const invoiceItems = items.map((item) => {
    const total = parseFloat(item.unitPrice) * item.quantity;
    totalUSD += total;
    return {
      code: item.code || null,
      name: item.name,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      total: parseFloat(total.toFixed(2)),
    };
  });

  const finalShipping = parseFloat(shippingCharges || 0);
  totalUSD = parseFloat((totalUSD + finalShipping).toFixed(2));

  const invoice = await Invoice.create({
    companyName, email, address, paymentMethod,
    noteForSupplier: noteForSupplier || null,
    invoiceNumber,
    PO_number: PO_number || null,
    invoiceDate,
    days,
    shippingCharges: finalShipping,
    totalUSD,
    comments: comments || null,
    emailToCustomer: emailToCustomer || false,
  });

  await Promise.all(
    invoiceItems.map((item) =>
      InvoiceItem.create({ invoiceId: invoice.id, ...item })
    )
  );

  if (emailToCustomer) {
    await sendInvoiceEmail(email, invoice);
  }

  const fullInvoice = await Invoice.findByPk(invoice.id, {
    include: [{ model: InvoiceItem, as: "items" }],
  });

  return successResponse({ res, data: fullInvoice, message: "Invoice created successfully", status: 201 });
});

const getAllInvoices = asyncWrapper(async (req, res) => {
  const invoices = await Invoice.findAll({
    include: [{ model: InvoiceItem, as: "items" }],
    order: [["createdAt", "DESC"]],
  });
  return successResponse({ res, data: invoices, message: "All invoices fetched", status: 200 });
});

const getInvoice = asyncWrapper(async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id, {
    include: [{ model: InvoiceItem, as: "items" }],
  });
  if (!invoice) return errorResponse({ res, message: "Invoice not found", status: 404 });
  return successResponse({ res, data: invoice, message: "Invoice fetched successfully", status: 200 });
});

const deleteInvoice = asyncWrapper(async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id);
  if (!invoice) return errorResponse({ res, message: "Invoice not found", status: 404 });
  await InvoiceItem.destroy({ where: { invoiceId: invoice.id } });
  await invoice.destroy();
  return successResponse({ res, message: "Invoice deleted successfully", status: 200 });
});

module.exports = { createInvoice, getAllInvoices, getInvoice, deleteInvoice };