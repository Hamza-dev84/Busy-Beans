
const invoiceTemplate = (invoice, items) => {
    const itemRows = items.map(i => `
        <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${parseFloat(i.unitPrice).toFixed(2)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${parseFloat(i.total).toFixed(2)}</td>
        </tr>`
    ).join("");

    const subtotal = parseFloat(invoice.totalUSD) - parseFloat(invoice.shippingCharges);

    return `
    <div style="font-family:Arial,sans-serif;max-width:550px;margin:0 auto;padding:24px;color:#333;">
        <h2 style="margin:0 0 4px;">Busy Beans Coffee</h2>
        <p style="margin:0 0 20px;color:#888;">Invoice</p>

        <p>Hi <strong>${invoice.companyName}</strong>,</p>
        <p>Please find your invoice details below.</p>

        <p>
            <strong>Invoice #:</strong> ${invoice.invoiceNumber}<br/>
            ${invoice.PO_number ? `<strong>PO Number:</strong> ${invoice.PO_number}<br/>` : ""}
            <strong>Invoice Date:</strong> ${invoice.invoiceDate}<br/>
            <strong>Payment Terms:</strong> ${invoice.days} days<br/>
            <strong>Payment Method:</strong> ${invoice.paymentMethod}<br/>
            ${invoice.address ? `<strong>Address:</strong> ${invoice.address}<br/>` : ""}
            ${invoice.comments ? `<strong>Comments:</strong> ${invoice.comments}<br/>` : ""}
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
            <thead>
                <tr style="background:#f5f5f5;">
                    <th style="padding:8px;text-align:left;">Item</th>
                    <th style="padding:8px;text-align:center;">Qty</th>
                    <th style="padding:8px;text-align:right;">Unit Price</th>
                    <th style="padding:8px;text-align:right;">Total</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <p style="text-align:right;">Subtotal: $${subtotal.toFixed(2)}</p>
        <p style="text-align:right;">Shipping: $${parseFloat(invoice.shippingCharges).toFixed(2)}</p>
        <p style="text-align:right;"><strong>Total: $${parseFloat(invoice.totalUSD).toFixed(2)}</strong></p>

        <p style="margin-top:24px;color:#888;font-size:13px;">
            Thank you for your business!<br/>
            Busy Beans Coffee
        </p>
    </div>`;
};

module.exports = { invoiceTemplate };