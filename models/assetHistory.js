const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const HISTORY_ACTIONS = ["Purchased", "Issued", "Returned", "Re-stocked", "Scrapped"];

const emptyToNull = (field) =>
  function (value) {
    this.setDataValue(field, value === "" || value === undefined ? null : value);
  };

const AssetHistory = sequelize.define(
  "AssetHistory",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    assetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "assets", key: "id" },
    },

    action: {
      type: DataTypes.ENUM(...HISTORY_ACTIONS),
      allowNull: false,
    },

    // the business date of the event (purchase date, issue date, return date...)
    actionDate: { type: DataTypes.DATEONLY, allowNull: false },

    // who held it (Issued / Returned only)
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "employees", key: "id" }, // use your real Employee table name
    },

    // Returned: Upgrade, Repair, Resignation...  Scrapped: Obsolete, Damaged...
    reason: { type: DataTypes.STRING(100), allowNull: true, set: emptyToNull("reason") },
    remarks: { type: DataTypes.TEXT, allowNull: true, set: emptyToNull("remarks") },

    // status change snapshot
    fromStatus: { type: DataTypes.STRING(20), allowNull: true },
    toStatus: { type: DataTypes.STRING(20), allowNull: false },

    // money snapshot: filled on "Purchased" (acqPrice), useful for utilization reports
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },

    performedBy: { type: DataTypes.INTEGER, allowNull: true }, // user id
  },
  {
    tableName: "asset_history",
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ["assetId", "actionDate"] }, { fields: ["employeeId"] }],
  }
);

module.exports = AssetHistory;
module.exports.HISTORY_ACTIONS = HISTORY_ACTIONS;