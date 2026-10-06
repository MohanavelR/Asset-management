const { sequelize } = require("../config/db")
const { DataTypes } = require("sequelize")
const bcrypt = require("bcrypt")
const generateOTP = require("../helpers/OtpGenerate")

const User = sequelize.define(
  "User",
  {
    // ========= Auto Fields ===========
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // ========= Required Fields ===========
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

   
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },

    
    role: {
      type: DataTypes.ENUM("ADMIN", "USER"),
      defaultValue: "USER",
      allowNull: false,
    },

    // ========= Optional Fields ===========
    loginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    isLogged: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },

    // ========= Conditional Fields ===========
    forgotOtp: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },

    forgotOtpExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "users",

    defaultScope: {
      attributes: {
        exclude: [],
      },
    },

    hooks: {
      // ===== Hashing Password========
      beforeSave: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 10)
        }
      },
    },
  }
)
// ============ Object Helper Functions===============

User.prototype.isMatchPassword = async function (password) {
  return await bcrypt.compare(password, this.password)
}

User.prototype.setForgotOtp = async function () {
  const otp = generateOTP(4)
  this.forgotOtp = otp
  this.forgotOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
  await this.save()
  return otp
}

User.prototype.isMatchOtp = function (otp) {
  return (
    this.forgotOtp === otp &&
    this.forgotOtpExpiresAt &&
    this.forgotOtpExpiresAt > new Date()
  )
}

module.exports = User

// sequelize.define(
//     "Model Name",
//     attributes,
//    { tableName:"" }
// );