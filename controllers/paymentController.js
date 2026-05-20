
const stripe = require("../config/stripe");
const LocalPartner = require("../models/LocalPartner");
const orderProfit = require("../models/OrderProfit");
const { Order, OrderItem, Product } = require("../models/index");
const asyncWrapper = require("../utilities/asyncWrapper");
const { successResponse, errorResponse } = require("../utilities/responseHandler");

const connectOrCheckStripeAccount = asyncWrapper(async (req, res) => {
    const partner = await LocalPartner.findByPk(req.partner.id);

    if (partner.stripeAccountId && partner.stripeAccountStatus === "active") {
        const account = await stripe.accounts.retrieve(partner.stripeAccountId);
        const isActive = account.charges_enabled && account.payouts_enabled;
        
        const bankAccount = account.external_accounts?.data[0];
        console.log("Bank account details", bankAccount);

        if (isActive) {
            return successResponse({
                res,
                message: "Stripe account is active",
                data: {
                    stripeLinked: true,
                    stripeAccountStatus: "active",
                    onboardingRequired: false,
                },
                status: 200
            });
        }
    }

    if (partner.stripeAccountId && partner.stripeAccountStatus !== "active") {
        const account = await stripe.accounts.retrieve(partner.stripeAccountId);
        console.log(account);
        const isActive = account.charges_enabled && account.payouts_enabled;

        if (isActive) {
            await partner.update({ stripeAccountStatus: "active" });
            return successResponse({
                res,
                message: "Stripe account is now active",
                data: {
                    stripeLinked: true,
                    stripeAccountStatus: "active",
                    onboardingRequired: false,
                },
                status: 200
            });
        }


        const accountLink = await stripe.accountLinks.create({
            account: partner.stripeAccountId,
            refresh_url: `${process.env.FRONTEND_URL}/partner/stripe/refresh`,
            return_url: `${process.env.FRONTEND_URL}/partner/stripe/success`,
            type: "account_onboarding",
        });

        return successResponse({
            res,
            message: "Stripe onboarding incomplete",
            data: {
                stripeLinked: false,
                stripeAccountStatus: "pending",
                onboardingRequired: true,
                onboardingUrl: accountLink.url,
            },
            status: 200
        });
    }


    const account = await stripe.accounts.create({
        type: "express",
        email: partner.email,
        capabilities: {
            transfers: { requested: true },
        },
    });

    await partner.update({
        stripeAccountId: account.id,
        stripeAccountStatus: "pending"
    });

    const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL}/partner/stripe/refresh`,
        return_url: `${process.env.FRONTEND_URL}/partner/stripe/success`,
        type: "account_onboarding",
    });

    return successResponse({
        res,
        message: "Stripe account created, complete onboarding",
        data: {
            stripeLinked: false,
            stripeAccountStatus: "pending",
            onboardingRequired: true,
            onboardingUrl: accountLink.url,
        },
        status: 201
    });
});

const createPaymentIntent = asyncWrapper(async (req, res) => {
    const { orderId } = req.body;

    const order = await Order.findByPk(orderId, {
        include: [
            { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] },
            { model: orderProfit, as: "profit" },
        ]
    });

    if (!order) return errorResponse({ res, message: "Order not found", status: 404 });

    if (order.paymentStatus === "paid") {
        return errorResponse({ res, message: "Order already paid", status: 400 });
    }

    const totalInCents = Math.round(parseFloat(order.total) * 100);

    const orderTypeLabel = order.isLocalPartner && order.customerId ? "Partner Customer Order" :
        order.isLocalPartner ? "Partner Order" : "Customer Order";

    let transferData = null;

    if (order.isLocalPartner && order.customerId && order.localPartnerId) {
        const partner = await LocalPartner.findByPk(order.localPartnerId);

        if (!partner?.stripeAccountId || partner?.stripeAccountStatus !== "active") {
            return errorResponse({
                res,
                message: "Partner Stripe account not active",
                status: 400
            });
        }

        const partnerProfit = parseFloat(order.profit?.partnerProfit || 0);

        if (partnerProfit <= 0) {
            return errorResponse({
                res,
                message: "Partner profit is 0 — cannot create transfer",
                status: 400
            });
        }

        const partnerProfitInCents = Math.round(partnerProfit * 100);

        transferData = {
            destination: partner.stripeAccountId,
            amount: partnerProfitInCents,
        };
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: totalInCents,
        currency: "usd",
        payment_method_types: ["card"],
        description: `${orderTypeLabel} — Order #${order.id}`,
        metadata: {
            orderId: order.id,
            orderType: order.isLocalPartner && order.customerId ? "partner_customer" :
                order.isLocalPartner ? "partner" : "customer"
        },
        ...(transferData && { transfer_data: transferData }),
    });

    return successResponse({
        res,
        message: "Payment intent created",
        data: {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: parseFloat(order.total).toFixed(2),
            orderType: orderTypeLabel,
            description: `${orderTypeLabel} — Order #${order.id}`,
        },
        status: 201
    });
});

const recordBankCheckPayment = asyncWrapper(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return errorResponse({ res, message: "orderId is required", status: 400 });
    }

    const order = await Order.findByPk(orderId);
    if (!order) return errorResponse({ res, message: "Order not found", status: 404 });

    await order.update({ paymentStatus: "paid" });

    return successResponse({
        res,
        message: "Payment marked as paid",
        data: { orderId: order.id, paymentStatus: "paid" },
        status: 200
    });
});

const handleWebhook = asyncWrapper(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("Webhook signature failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;
        const orderType = paymentIntent.metadata.orderType;

        console.log(`Payment succeeded — Order #${orderId}, Type: ${orderType}`);

        const order = await Order.findByPk(orderId);
        if (order) {
            await order.update({
                paymentStatus: "paid",
                paidAmount: parseFloat(paymentIntent.amount_received / 100).toFixed(2),
            });
            console.log(`Order #${orderId} marked as paid`);
        }
    }

    if (event.type === "payment_intent.payment_failed") {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        const order = await Order.findByPk(orderId);
        if (order) {
            await order.update({ paymentStatus: "failed" });
            console.log(`Order #${orderId} payment failed`);
        }
    }

    res.json({ received: true });
});

module.exports = {
    connectOrCheckStripeAccount, createPaymentIntent,
    recordBankCheckPayment, handleWebhook
};