const { sequelize } = require("../config/db");

const User = require("./user");
const Employee = require("./employee");
const Asset = require("./asset");
const AssetCategory = require("./assetCategory");
const AssetIssue = require("./issueAsset.js");
const AssetHistory = require("./assetHistory");

// ========= Asset <-> Category ===========
Asset.belongsTo(AssetCategory, { foreignKey: "category", as: "categoryInfo" });
AssetCategory.hasMany(Asset, { foreignKey: "category", as: "assets", onDelete: "RESTRICT" });

// ========= Asset <-> Employee (currently assigned) ===========
Asset.belongsTo(Employee, { foreignKey: "assignedTo", as: "employee" });
Employee.hasMany(Asset, { foreignKey: "assignedTo", as: "assets", onDelete: "SET NULL" });

// ========= User <-> Employee (who created the employee) ===========
Employee.belongsTo(User, { foreignKey: "c_by", as: "creator" });
User.hasMany(Employee, { foreignKey: "c_by", as: "createdEmployees", onDelete: "RESTRICT" });

// ========= Asset <-> AssetIssue ===========
AssetIssue.belongsTo(Asset, { foreignKey: "assetId", as: "asset" });
Asset.hasMany(AssetIssue, { foreignKey: "assetId", as: "issues", onDelete: "RESTRICT" });

// ========= Employee <-> AssetIssue ===========
AssetIssue.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
Employee.hasMany(AssetIssue, { foreignKey: "employeeId", as: "issues", onDelete: "RESTRICT" });

// ========= User <-> AssetIssue (who issued / who received the return) ===========
AssetIssue.belongsTo(User, { foreignKey: "issuedBy", as: "issuer" });
AssetIssue.belongsTo(User, { foreignKey: "returnedBy", as: "returnReceiver" });
User.hasMany(AssetIssue, { foreignKey: "issuedBy", as: "issuedAssets", onDelete: "SET NULL" });
User.hasMany(AssetIssue, { foreignKey: "returnedBy", as: "receivedReturns", onDelete: "SET NULL" });

// ========= Asset <-> AssetHistory ===========
AssetHistory.belongsTo(Asset, { foreignKey: "assetId", as: "asset" });
Asset.hasMany(AssetHistory, { foreignKey: "assetId", as: "history", onDelete: "RESTRICT" });

// ========= Employee <-> AssetHistory ===========
AssetHistory.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
Employee.hasMany(AssetHistory, { foreignKey: "employeeId", as: "history", onDelete: "SET NULL" });

// ========= User <-> AssetHistory (who performed the action) ===========
AssetHistory.belongsTo(User, { foreignKey: "performedBy", as: "performer" });
User.hasMany(AssetHistory, { foreignKey: "performedBy", as: "performedHistory", onDelete: "SET NULL" });
// ========= User <-> Employee (employee's own login account) ===========
Employee.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasOne(Employee, { foreignKey: "userId", as: "employee" });

module.exports = {
  sequelize,
  User,
  Employee,
  Asset,
  AssetCategory,
  AssetIssue,
  AssetHistory,
};