const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const RETURN_REASONS = ["Upgrade", "Repair", "Resignation", "Replacement", "Other"];

const emptyToNull = (field) =>
  function (value) {
    this.setDataValue(field, value === "" || value === undefined ? null : value);
  };

const AssetIssue = sequelize.define(
  "AssetIssue",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

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

    issueDate: { type: DataTypes.DATEONLY, allowNull: false },
    issueRemarks: { type: DataTypes.TEXT, allowNull: true, set: emptyToNull("issueRemarks") },

    // empty until the asset is returned
    returnDate: { type: DataTypes.DATEONLY, allowNull: true, set: emptyToNull("returnDate") },
    returnReason: {
      type: DataTypes.ENUM(...RETURN_REASONS),
      allowNull: true,
      set: emptyToNull("returnReason"),
    },
    returnRemarks: { type: DataTypes.TEXT, allowNull: true, set: emptyToNull("returnRemarks") },

    issuedBy: { type: DataTypes.INTEGER, allowNull: true },
    returnedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "asset_issues",
    timestamps: true,

    indexes: [
      // an asset can have only ONE open issue (returnDate is null) at a time
      { unique: true, fields: ["assetId"], where: { returnDate: null }, name: "uq_asset_open_issue" },
      { fields: ["employeeId"] },
    ],

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
module.exports.RETURN_REASONS = RETURN_REASONS;