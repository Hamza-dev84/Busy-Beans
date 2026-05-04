
const puppeteer = require("puppeteer");

const generateInvoicePDF = async (invoice) => {
    const itemRows = invoice.items.map(i => `
        <tr>
            <td>${i.code}</td>
            <td><strong>${i.name}</strong></td>
            <td>${i.quantity}</td>
            <td>$${i.unitPrice.toFixed(2)}</td>
            <td>$${i.total.toFixed(2)}</td>
        </tr>`
    ).join("");

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8"/>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 13px; color: #333; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
            .header h1 { font-size: 36px; font-weight: 900; color: #111; }
            .logo { font-size: 22px; font-weight: 700; color: #111; }
            .logo span { color: #c0622a; font-style: italic; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 32px; }
            .meta-left p { margin-bottom: 4px; }
            .meta-left strong { display: inline-block; min-width: 110px; }
            .company-info { text-align: right; font-size: 12px; color: #555; line-height: 1.6; }
            .invoice-to { margin-bottom: 32px; }
            .invoice-to p { line-height: 1.8; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            thead tr { border-bottom: 2px solid #333; }
            thead th { padding: 10px 8px; text-align: left; font-size: 13px; }
            tbody td { padding: 10px 8px; border-bottom: 1px solid #eee; }
            .totals { width: 260px; margin-left: auto; }
            .totals tr td { padding: 6px 8px; }
            .totals tr td:last-child { text-align: right; }
            .totals .grand-total td { font-weight: 700; font-size: 15px; border-top: 2px solid #333; }
            .footer { margin-top: 40px; font-size: 12px; color: #666; line-height: 1.8; }
            .footer-bottom { margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px; font-size: 12px; color: #999; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>INVOICE</h1>
            <div class="logo">BUSY BEAN<span>Coffee</span></div>
        </div>

        <div class="meta">
            <div class="meta-left">
                <p><strong>Invoice #</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Order #</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Invoice Date</strong> ${invoice.invoiceDate}</p>
                <p><strong>Terms</strong> 30 Days</p>
                <p><strong>Payment Due</strong> ${invoice.paymentDueDate}</p>
                <p><strong>P.O. #</strong></p>
            </div>
            <div>
                <p><strong>Invoice To</strong></p>
                <p>${invoice.companyName}</p>
                <p>${invoice.address}</p>
                <p>Phone: ${invoice.phone || ""}</p>
                <p>Email: ${invoice.email || ""}</p>
            </div>
            <div class="company-info">
                <p>Busy Bean Coffee Inc.</p>
                <p>street address 090</p>
                <p>Washington, Pensalvaniya 34251</p>
                <p>USA</p>
                <p>765-456-7890</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <table class="totals">
            <tr><td>Subtotal</td><td>$${invoice.subtotal.toFixed(2)}</td></tr>
            <tr><td>Shipping Charges</td><td>$${invoice.shippingCharges.toFixed(2)}</td></tr>
            <tr class="grand-total"><td>Total</td><td>$${invoice.total.toFixed(2)}</td></tr>
        </table>

        <div class="footer">
            <p>Here's your invoice! Thank you for your continued support.</p>
            <br/>
            <p>Please remit payment to:</p>
            <p>Busy Bean Coffee Inc.</p>
            <p>street address 090, Washington, Pensalvaniya 34251, USA</p>
            <p>765-456-7890</p>
            <br/>
            <p>Thanks for your business!</p>
            <p><strong>Busy Bean Coffee Inc.</strong></p>
        </div>
    </body>
    </html>`;

    const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" } });
    await browser.close();

    return pdfBuffer;
};

module.exports = { generateInvoicePDF };