const {Sequelize}=require("sequelize")
const logger=require("../helpers/logger")

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres",
        logging: false
    }
);

const onDB=async ()=>{
    try {
       await sequelize.authenticate()
       logger.info("Database connected")
       await sequelize.sync() 
       logger.info("Database models synchronized")
    } catch (error) {
       logger.error("Database connection failed:", error.message) 
    }
}

module.exports = {
    sequelize,onDB
};