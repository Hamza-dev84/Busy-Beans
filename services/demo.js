const sendOrderInvoiceEmail = async (toEmail, invoice, pdfBuffer) => {
    await transporter.sendMail({
        from: `"Busy Beans Coffee" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Your Invoice ${invoice.invoiceNumber} — Busy Beans Coffee`,
        html: orderInvoiceEmailTemplate(invoice),
        attachments: [
            {
                filename: `${invoice.invoiceNumber}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
            }
        ]
    });
};