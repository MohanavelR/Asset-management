const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const emptyToNull = require("../helpers/emptyToNull");
const { RETURN_REASONS } = require("../config/contants");


const AssetIssue = sequelize.define(
  "AssetIssue",
  {
    // ========= Auto Fields ===========
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // ========= Required Fields ===========
    assetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "assets", key: "id" },
    },

    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "employees", key: "id" }, // use your real Employee table name
    },

    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    // ========= Optional Fields ===========
    issueRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      set: emptyToNull("issueRemarks"),
    },

    issuedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    returnedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // ========= Conditional Fields ===========
    
    returnDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      set: emptyToNull("returnDate"),
    },

  
    returnReason: {
      type: DataTypes.ENUM(...RETURN_REASONS),
      allowNull: true,
      set: emptyToNull("returnReason"),
    },

    
    returnRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      set: emptyToNull("returnRemarks"),
    },
  },
  {
    tableName: "asset_issues",
    timestamps: true,

    indexes: [
   
      { 
        unique: true, 
        fields: ["assetId"], 
        where: { returnDate: null }, 
        name: "uq_asset_open_issue" 
      },
      { 
        fields: ["employeeId"] 
      },
    ],
  
    // Condition Field conditions  
    validate: {
      returnNeedsReason() {
        if (this.returnDate && !this.returnReason) {
          throw new Error("Reason for return is required");
        }
      },
      returnNotBeforeIssue() {
        if (this.returnDate && this.issueDate && this.returnDate < this.issueDate) {
          throw new Error("Return date cannot be before issue date");
        }
      },
      otherNeedsRemarks() {
        if (this.returnReason === "Other" && !this.returnRemarks) {
          throw new Error("Please explain the reason in remarks");
        }
      },
    },
  }
);

module.exports = AssetIssue;
