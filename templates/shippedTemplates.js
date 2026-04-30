
const shippedTemplate = (customerName, order) => {
    return `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;color:#333;">
        <h2 style="margin:0 0 4px;">Busy Beans Coffee</h2>
        <p style="margin:0 0 20px;color:#888;">Order Shipped</p>

        <p>Hi <strong>${customerName}</strong>,</p>
        <p>Great news! Your order has been shipped and is on its way to you.</p>

        <p>
            <strong>Order ID:</strong> #${order.id}<br/>
            <strong>Shipped On:</strong> ${new Date().toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}<br/>
            <strong>Payment Method:</strong> ${order.paymentMethod}<br/>
            ${order.noteForSupplier ? `<strong>Note:</strong> ${order.noteForSupplier}<br/>` : ""}
        </p>

        <p>
            <strong>Subtotal:</strong> $${parseFloat(order.subtotal).toFixed(2)}<br/>
            <strong>Shipping Charges:</strong> $${parseFloat(order.shippingCharges).toFixed(2)}<br/>
            <strong>Total:</strong> $${parseFloat(order.total).toFixed(2)}
        </p>

        <p style="margin-top:24px;color:#888;font-size:13px;">
            Thank you for shopping with us!<br/>
            Busy Beans Coffee
        </p>
    </div>`;
};

module.exports = { shippedTemplate };