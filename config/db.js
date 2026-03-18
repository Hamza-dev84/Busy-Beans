
const {Sequelize} = require("sequelize");

const sequelize = new Sequelize(
    process.env.DB_NAME,    
    process.env.DB_USER,
    process.env.DB_PASSWORD,{
        host: process.env.DB_HOST,
        dialect: "mysql"
    }
)

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database Connected");
    } catch (error) {
        console.log("Database Connection Failed", error);
    }
}

module.exports = {
    sequelize, connectDB
}