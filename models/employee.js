const { sequelize } = require("../config/db")
const { DataTypes } = require("sequelize")

const Employee = sequelize.define(
    "Employee",
    {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        employeeId: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate:{
            notEmpty:true
          }
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate:{
            notEmpty:true
          }
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: { isEmail: true }
        },
        phone: {
         type: DataTypes.STRING,
         allowNull: false,
          validate:{
            notEmpty:true
          }
        },
        department: {
          type: DataTypes.STRING,
          allowNull: false,
          validate:{
            notEmpty:true
          }
        },
        designation: {
          type: DataTypes.STRING,
          allowNull: false,
          validate:{
            notEmpty:true,
          validate:{
            notEmpty:true
          }
          }
        },
        branch: {
          type: DataTypes.STRING,
          allowNull: false,
          validate:{
            notEmpty:true
          }
        },
        status: {
          type: DataTypes.ENUM("Active", "Inactive"),
          defaultValue: "Active"
        },
        c_by: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
             model: "users",        
             key: "id"
         },
         onUpdate: "CASCADE",
         onDelete: "RESTRICT"     
        }
    },
    {
        tableName: "employees",
        timestamps: true
    }
)

module.exports = Employee