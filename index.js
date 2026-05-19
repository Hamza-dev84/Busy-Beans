
process.env.TZ = "Asia/Karachi";
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./middlewares/errorHandlerMiddleware");
const { connectDB, sequelize } = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderTrackingRoutes = require("./routes/orderTrackingRoutes");
const localPartnerRoutes = require("./routes/localPartner");
const customerRoutes = require("./routes/customerRoutes");
const partnerProductRoutes = require("./routes/partnerProductRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const reportRoutes = require("./routes/reportRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
app.use("/stripe/webhook", express.raw({ type: "application/json" }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/admin", adminRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/orders", orderTrackingRoutes);
app.use("/partners", localPartnerRoutes);
app.use("/customer", customerRoutes);
app.use("/partner-products", partnerProductRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/report", reportRoutes);
app.use("/stripe", paymentRoutes);

app.use(errorHandler);

connectDB();
sequelize.sync({ alter: false });

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("App running on PORT", PORT);
});