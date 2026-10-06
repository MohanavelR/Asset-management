const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const AssetCategory = sequelize.define(
  "AssetCategory",
  {
    // ========= Auto Fields ===========
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // ========= Required Fields ===========
  
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: { 
        msg: "Category name already exists" 
      },
      validate: {
        notEmpty: { 
          msg: "Category name is required" 
        },
        len: { 
          args: [2, 100], 
          msg: "Category name must be 2-100 characters"
        },
      },
    },

    // ========= Optional Fields ===========
    desc: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    c_by: { 
      type: DataTypes.INTEGER, 
      allowNull: true },
  },
  {
    tableName: "asset_categories",
    timestamps: true,
  },
);

module.exports = AssetCategory;