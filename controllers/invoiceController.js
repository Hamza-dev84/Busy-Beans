const { sequelize } = require("../config/db");
const { Invoice, InvoiceItem } = require("../models/index");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");
const {sendInvoiceEmail} = require("../services/emailService");
const nodemailer = require("nodemailer");

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

  const { invoice } = await sequelize.transaction(async (t) => {
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
  }, {transaction: t});

  await Promise.all(
    invoiceItems.map((item) =>
      InvoiceItem.create(
        { invoiceId: invoice.id, ...item }, {transaction: t})
    )
  );

  return {invoice};
  })

  if (emailToCustomer) {
    await sendInvoiceEmail(email, invoice, invoiceItems);
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