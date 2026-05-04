
const orderInvoiceEmailTemplate = (invoice) => {
    const itemRows = invoice.items.map(i => `
        <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${i.unitPrice.toFixed(2)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${i.total.toFixed(2)}</td>
        </tr>`
    ).join("");

    return `
    <div style="font-family:Arial,sans-serif;max-width:550px;margin:0 auto;padding:24px;color:#333;">
        <h2 style="margin:0 0 4px;">Busy Beans Coffee</h2>
        <p style="margin:0 0 20px;color:#888;">Invoice ${invoice.invoiceNumber}</p>

        <p style="font-size:20px;font-weight:700;color:#333;">$${invoice.total.toFixed(2)} due by ${invoice.paymentDueDate}</p>
        <p style="margin:0 0 20px;">
            <a href="https://busybeancoffee.com/pay-order-invoice" style="background:#86644c;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;font-size:13px;">Pay Invoice</a>
        </p>

        <p>Dear <strong>${invoice.companyName}</strong>,</p>
        <p>Please find the attached invoice <strong>${invoice.invoiceNumber}</strong> from Busy Bean Coffee, Inc.</p>

        <p>
            <strong>Order ID:</strong> ${invoice.orderId}<br/>
            <strong>Invoice Date:</strong> ${invoice.invoiceDate}<br/>
            <strong>Company Name:</strong> ${invoice.companyName}<br/>
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
            <thead>
                <tr style="background:#f5f5f5;">
                    <th style="padding:8px;text-align:left;">Item</th>
                    <th style="padding:8px;text-align:center;">Qty</th>
                    <th style="padding:8px;text-align:right;">Unit Price</th>
                    <th style="padding:8px;text-align:right;">Amount</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <p style="text-align:right;">Subtotal: $${invoice.subtotal.toFixed(2)}</p>
        <p style="text-align:right;">Shipping Charges: $${invoice.shippingCharges.toFixed(2)}</p>
        <p style="text-align:right;"><strong>Total: $${invoice.total.toFixed(2)}</strong></p>

        <p style="margin-top:24px;font-size:13px;color:#666;">
            If you'd like to place an order or need a customized package, feel free to contact us directly.
        </p>

        <p style="margin-top:24px;color:#888;font-size:12px;">
            Busy Bean Coffee Inc. · street address 090, Washington, Pensalvaniya 34251, USA<br/>
            765-456-7890
        </p>
    </div>`;
};

module.exports = { orderInvoiceEmailTemplate };