const {User} =require("../models/index")
const { Op } = require("sequelize")
const logger = require("../helpers/logger")
const { generateToken } = require("../helpers/token")


// ========= Login ===========
exports.login = async function (req, res) {
    try {
        const { loginId, password } = req.body

        // find user by username or email
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { userName: loginId },
                    { email: loginId }
                ]
            }
        })
        if (!user) {
            return res.status(400).json({
                message: "Invalid username/email or password",
                success: false
            })
        }

        const isPasswordMatch = await user.isMatchPassword(password)
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Invalid username/email or password",
                success: false
            })
        }
        
        if (!user?.isActive) {
            return res.status(401).json({
                message: "You account is inactive",
                success: false
            })
        }

        const token = await generateToken({ id: user?.id, role: user?.role })
        user.isLogged = true
        user.loginAt = Date.now()
        await user.save()

        
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Login successfully",
            success: true,
        })
    } catch (error) {
        logger.error(`login Error: ${error}`)
        return res.status(500).json({
            message: error.message,
            success: false
        })
    }
}

// ========= Forgot Password (generate OTP) ===========
exports.forgotPassword = async function (req, res) {
    try {
        const { loginId } = req.body

        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { userName: loginId },
                    { email: loginId }
                ]
            }
        })
        if (!user) {
            return res.status(401).json({
                message: "Invalid username/email",
                success: false
            })
        }

        const otp = await user.setForgotOtp()
        return res.status(200).json({
            message: "otp sent",
            success: true,
            otp
        })
    } catch (error) {
        logger.error(`Forgot Password Error: ${error}`)
        return res.status(500).json({
            message: error.message,
            success: false
        })
    }
}

// ========= OTP Verify ===========
exports.otpVerify = async function (req, res) {
    try {
        const { loginId, otp } = req.body

        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { userName: loginId },
                    { email: loginId }
                ]
            }
        })
        if (!user) {
            return res.status(401).json({
                message: "Invalid request",
                success: false
            })
        }

        const otpMatch = await user.isMatchOtp(otp)
        if (!otpMatch) {
            return res.status(401).json({
                message: "Invalid OTP / OTP Expired",
                success: false
            })
        }

        
        user.forgotOtp = null
        user.forgotOtpExpiresAt = null
        await user.save()

        return res.status(200).json({
            message: "otp verified",
            success: true,
        })
    } catch (error) {
        logger.error(`otpVerify Error: ${error}`)
        return res.status(500).json({
            message: error.message,
            success: false
        })
    }
}

// ========= Set Password (new password, hashed in model hook) ===========
exports.setPassword = async function (req, res) {
    try {
        const { loginId, password } = req.body

        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { userName: loginId },
                    { email: loginId }
                ]
            }
        })
        if (!user) {
            return res.status(401).json({
                message: "Invalid request",
                success: false
            })
        }

        user.password = password
        await user.save()

        return res.status(200).json({
            message: "password set successfully",
            success: true,
        })
    } catch (error) {
        logger.error(`setPassword Error: ${error}`)
        return res.status(500).json({
            message: error.message,
            success: false
        })
    }
}

// ========= Login Page ===========
exports.loginView = function (req, res) {
    try {
        res.render("auth/login")
    } catch (error) {
        logger.error(`Login View Error: ${error}`)
        res.render("error", { error })
    }
}

// ========= Forgot Password Page ===========
exports.forgotPasswordView = function (req, res) {
    try {
        res.render("auth/forgotPassword")
    } catch (error) {
        logger.error(`forgotPassword View Error: ${error}`)
        res.render("error", { error })
    }
}

// ========= OTP Verify Page ===========
exports.otpVerifyView = function (req, res) {
    try {
        res.render("auth/otpVerify")
    } catch (error) {
        logger.error(`otpVerify View Error: ${error}`)
        res.render("error", { error })
    }
}

// ========= Set Password Page ===========
exports.setPasswordView = function (req, res) {
    try {
        res.render("auth/setPassword")
    } catch (error) {
        logger.error(`setPassword View Error: ${error}`)
        res.render("error", { error })
    }
}

// ========= Logout ===========
exports.logout = async function (req, res) {
    try {
        const user = req.user
        if (!user) {
            return res.status(401).json({
                message: "Invalid request",
                success: false
            })
        }

        const currentUser = await User.findByPk(user.id)
        if (!currentUser) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        currentUser.isLogged = false
        currentUser.loginAt = null
        await currentUser.save()

        res.clearCookie("token")
        return res.status(200).json({
            message: "logout successfully",
            success: true
        })
    } catch (error) {
        logger.error(`Logout Error: ${error}`)
        return res.status(500).json({
            message: error.message,
            success: false
        })
    }
}