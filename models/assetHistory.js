const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const emptyToNull = require("../helpers/emptyToNull");
const { HISTORY_ACTIONS } = require("../config/contants");



const AssetHistory = sequelize.define(
  "AssetHistory",
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

    action: {
      type: DataTypes.ENUM(...HISTORY_ACTIONS),
      allowNull: false,
    },

    actionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    toStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    // ========= Optional Fields ===========
    
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "employees", key: "id" }, // use your real Employee table name
    },

    reason: {
      type: DataTypes.STRING(100),
      allowNull: true,
      set: emptyToNull("reason"),
    },

    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      set: emptyToNull("remarks"),
    },

    fromStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    performedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "asset_history",
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ["assetId", "actionDate"] }, { fields: ["employeeId"] }],
  }
);

module.exports = AssetHistory;
