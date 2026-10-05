const { DataTypes, Op } = require("sequelize");
const { sequelize } = require("../config/db");

const emptyToNull = (field) =>
    function (value) {
        this.setDataValue(field, value === "" || value === undefined ? null : value);
    };
const SCRAP_REASONS = ["Obsolete", "Damaged beyond repair", "Lost or stolen", "Other"];

const Asset = sequelize.define(
    "Asset",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        assetTag: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
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
            allowNull: false 
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
            type: DataTypes.ENUM("In Stock", "Issued", "Returned", "Scrapped"),
            defaultValue: "In Stock",
            allowNull: false,
        },
        // ---- optional ----
        issuedDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            set: emptyToNull("issuedDate")
        },
        returnDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            set: emptyToNull("returnDate")
        },
        scrappedDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            set: emptyToNull("scrappedDate")
        },
        warrantyStartDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            set: emptyToNull("warrantyStartDate")
        },
        warrantyEndDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            set: emptyToNull("warrantyEndDate")
        },
        assignedTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            set: emptyToNull("assignedTo")
        },
        specifications: {
            type: DataTypes.TEXT,
            allowNull: true,
            set: emptyToNull("specifications")
        },
        c_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        scrapReason:  { type: DataTypes.STRING(100), allowNull: true, set: emptyToNull("scrapReason") },
scrapRemarks: { type: DataTypes.TEXT, allowNull: true, set: emptyToNull("scrapRemarks") },
scrappedBy:   { type: DataTypes.INTEGER, allowNull: true },

    },
    {
        tableName: "assets",
        timestamps: true,
        hooks:{
            afterCreate:async function(asset,options){
                const tag = `AST-${String(asset.id).padStart(4, "0")}`
                await asset.update({assetTag:tag},{transaction:options.transaction}) 
            }
        },
        defaultScope: { where: { status: { [Op.ne]: "Scrapped" } } },
        validate: {
            issuedNeedsEmployee() {
                if (this.status === "Issued" && !this.assignedTo) {
                    throw new Error("Assigned employee is required when status is Issued");
                }
            },
            scrappedNeedsDate() {
                if (this.status === "Scrapped" && !this.scrappedDate) {
                    throw new Error("Scrapped date is required when status is Scrapped");
                }
            },
            
        },
    }
);

module.exports = Asset;
module.exports.SCRAP_REASONS = SCRAP_REASONS;