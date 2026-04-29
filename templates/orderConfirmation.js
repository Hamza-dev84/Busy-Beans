

function orderConfirmationTemplate({ customerName, orderId, companyName, deliveryAddress, items, total, shippingCharges, estimatedTime, createdAt, isPartnerEmail, customerCompany, adminReceives, partnerProfit }) {

    const date = new Date(createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });

    const itemRows = items.map(i => `
        <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${(i.price * i.quantity).toFixed(2)}</td>
        </tr>`
    ).join("");

    return `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;color:#333;">
        <h2 style="margin:0 0 4px;">Busy Beans Coffee</h2>
        <p style="margin:0 0 20px;color:#888;">Order Confirmation</p>

        <p>Hi <strong>${customerName}</strong>,</p>
        <p>${isPartnerEmail ? `A new order has been placed by your customer ${customerCompany}` : "Your order has been placed successfully."}</p>

        <p>
            <strong>Order ID:</strong> #${orderId}<br/>
            <strong>Order Date:</strong> ${date}<br/>
            ${isPartnerEmail && customerCompany ? `<strong>Company Name:</strong> ${customerCompany}<br/>` : ""}
            ${deliveryAddress ? `<strong>Delivery Address:</strong> ${deliveryAddress}<br/>` : ""}
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
            <thead>
                <tr style="background:#f5f5f5;">
                    <th style="padding:8px;text-align:left;">Item</th>
                    <th style="padding:8px;text-align:center;">Qty</th>
                    <th style="padding:8px;text-align:right;">Price</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <p style="text-align:right;">Subtotal: $${(total - shippingCharges).toFixed(2)}</p>
        <p style="text-align:right;">Shipping Charges: $${shippingCharges.toFixed(2)}</p>
        <p style="text-align:right;"><strong>Total: $${total.toFixed(2)}</strong></p>

        ${isPartnerEmail && partnerProfit != null ? `
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0;"/>
        <p style="color:#888;font-size:13px;"><strong>Profit Breakdown</strong></p>
        <p style="font-size:13px;">
            Order Total: $${total.toFixed(2)}<br/>
            Admin Receives: $${parseFloat(adminReceives).toFixed(2)}<br/>
            <strong>Your Profit: $${parseFloat(partnerProfit).toFixed(2)}</strong>
        </p>` : ""}

        <p style="margin-top:24px;color:#888;font-size:13px;">
            Thank you!<br/>
            Busy Beans Coffee
        </p>
    </div>`;
}

module.exports = { orderConfirmationTemplate };