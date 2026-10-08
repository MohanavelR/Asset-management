const { sequelize } = require("../config/db")
const { DataTypes } = require("sequelize")

const Employee = sequelize.define(
    "Employee",
    {
       // ========= Auto Fields ===========
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        // ========= Required Fields ===========
        employeeId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            
            validate: {
                notEmpty: true
            }
        },

        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },

        phone: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },

        department: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },

        designation: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },

        branch: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },

        // user who created this record
        c_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id"
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT"
        },

        // ========= Optional Fields ===========
        status: {
            type: DataTypes.ENUM("Active", "Inactive"),
            defaultValue: "Active"
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,          
            unique: true,           
            references: {
                model: "users",
                key: "id"
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"     
       },
    },
    {
        tableName: "employees",
        timestamps: true
    }
)

module.exports = Employee