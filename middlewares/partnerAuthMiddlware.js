
const jwt = require("jsonwebtoken");
const LocalPartner = require("../models/LocalPartner");

const partnerProtect = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const partner = await LocalPartner.findByPk(decoded.id);
        if (!partner) return res.status(401).json({ message: "Partner not found" });
        req.partner = partner;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

const partnerStripeCheck = async (req, res, next) => {
    const partner = req.partner;
    if (!partner.stripeAccountId || partner.stripeAccountStatus !== "active") {
        return res.status(403).json({
            message: "Stripe account not linked",
            stripeLinked: false,
            onboardingRequired: true
        });
    }
    next();
};

module.exports = { partnerProtect, partnerStripeCheck };
