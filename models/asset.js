const { DataTypes, Op } = require("sequelize");
const { sequelize } = require("../config/db");
const emptyToNull = require("../helpers/emptyToNull");

const Asset = sequelize.define(
    "Asset",
    {
        // ========= Auto Fields ===========
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

        // ========= Required Fields ===========
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

        // ========= Optional Fields ===========
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
        specifications: {
            type: DataTypes.TEXT,
            allowNull: true,
            set: emptyToNull("specifications")
        },
        c_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        // ========= Conditional Fields ===========
       
        assignedTo: {   
            type: DataTypes.INTEGER,
            allowNull: true,
            set: emptyToNull("assignedTo")
        },
        scrappedDate: { 
            type: DataTypes.DATEONLY,
            allowNull: true,
            set: emptyToNull("scrappedDate")
        },
        scrapReason:  { 
            type: DataTypes.STRING(100), 
            allowNull: true, 
            set: emptyToNull("scrapReason") 
        },
        scrapRemarks: { 
            type: DataTypes.TEXT, 
            allowNull: true, 
            set: emptyToNull("scrapRemarks") 
        },
        scrappedBy:   { 
            type: DataTypes.INTEGER, 
            allowNull: true 
        },
    },
    {
        tableName: "assets",
        timestamps: true,
        hooks: {
            // ========== Generate Asset ID =============
            afterCreate: async function (asset, options) {
                const tag = `AST-${String(asset.id).padStart(4, "0")}`
                await asset.update({ assetTag: tag }, { transaction: options.transaction })
            }
        },
        
        // ===== This is for Normally Call Get Method doesn't come ===========
        defaultScope: { 
            where: { 
                status: { [Op.ne]: "Scrapped" } 
            } 
        },
        
        // ========= Condition field Conditions ===========
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
