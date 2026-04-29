
const dispatchTemplate = (supplierName, order) => {
    return `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;color:#333;">
        <h2 style="margin:0 0 4px;">Busy Beans Coffee</h2>
        <p style="margin:0 0 20px;color:#888;">Order Dispatched</p>

        <p>Hi <strong>${supplierName}</strong>,</p>
        <p>A new order has been dispatched to you. Please process it at your earliest.</p>

        <p>
            <strong>Order ID:</strong> #${order.id}<br/>
            <strong>Date:</strong> ${new Date(order.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}<br/>
            <strong>Payment Method:</strong> ${order.paymentMethod}<br/>
            <strong>Order Frequency:</strong> ${order.orderFrequency}<br/>
            ${order.purchaseOrderNumber ? `<strong>PO Number:</strong> ${order.purchaseOrderNumber}<br/>` : ""}
            ${order.noteForSupplier ? `<strong>Note:</strong> ${order.noteForSupplier}<br/>` : ""}
        </p>

        <p>
            <strong>Subtotal:</strong> $${parseFloat(order.subtotal).toFixed(2)}<br/>
            <strong>Shipping:</strong> $${parseFloat(order.shippingCharges).toFixed(2)}<br/>
            <strong>Total:</strong> $${parseFloat(order.total).toFixed(2)}
        </p>

        <p style="margin-top:24px;color:#888;font-size:13px;">
            Please confirm receipt of this order.<br/>
            Busy Beans Coffee
        </p>
    </div>`;
};

module.exports = { dispatchTemplate };