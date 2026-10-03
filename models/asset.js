const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Asset = sequelize.define(
    "Asset",
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        },
        serial_no: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: { msg: "Serial number already exists" },
            validate: { notEmpty: { msg: "Serial number is required" } },
        },
        category: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "asset_categories", key: "id" },
        },
        make: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { notEmpty: { msg: "Make is required" } },
        },
        model: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { notEmpty: { msg: "Model is required" } },
        },
        acqDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        acqPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { isDecimal: true, min: 0 },
        },
        vendor: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { notEmpty: { msg: "Vendor is required" } },
        },
        branch: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { notEmpty: { msg: "Branch is required" } },
        },
        status: {
            type: DataTypes.ENUM("In Stock", "Issued", "Repair", "Scrapped"),
            defaultValue: "In Stock",
            allowNull: false,
        },
        issuedDate: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        returnDate: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        specifications: { 
            type: DataTypes.TEXT, 
            allowNull: true 
        }, 
        scrappedDate: { 
            type: DataTypes.DATEONLY, 
            allowNull: true 
        },
        c_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
        tableName: "assets",
        timestamps: true,
    },
);

module.exports = Asset;