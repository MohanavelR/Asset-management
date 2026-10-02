const { loginView, login, forgotPasswordView, otpVerifyView, setPasswordView, forgotPassword, otpVerify, setPassword, logout } = require("../controllers/auth");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const authMiddleWare = require("../middleware/authMiddleware");
const guestMiddleware = require("../middleware/guestMiddleware");

const router=require("express").Router()

router.get("/login",guestMiddleware,loginView);
router.get("/forgot-password",guestMiddleware,forgotPasswordView);
router.get("/otp-verify",guestMiddleware,otpVerifyView);
router.get("/set-password",guestMiddleware,setPasswordView);

router.post("/loginApi",login)
router.post("/forgotPasswordApi",forgotPassword)
router.post("/otpVerifyApi",otpVerify)
router.post("/setPasswordApi",setPassword)
router.post("/logoutApi",apiAuthMiddleware,logout)

module.exports=router