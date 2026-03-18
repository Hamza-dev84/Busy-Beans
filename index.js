
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./middlewares/errorHandlerMiddleware");
const {connectDB, sequelize} = require("./config/db");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/admin", adminRoutes);
app.use("/products", productRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(errorHandler);

connectDB();

sequelize.sync({alter: true});

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log("App running on PORT", PORT);
})