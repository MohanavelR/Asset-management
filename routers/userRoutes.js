const { dashboardView, userManageView, updateUserStatus, createUser, userManageList, changePassword } = require("../controllers/user");
const adminApiAuthMiddleware = require("../middleware/adminApiMiddleware");
const adminPageAuthMiddleware = require("../middleware/adminPageMiddleware");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const authMiddleWare = require("../middleware/authMiddleware");
const pageAuthMiddleware = require("../middleware/pageMiddleware");

const router=require("express").Router()
router.get("/dashboard",pageAuthMiddleware,dashboardView);
router.get("/user-management",adminPageAuthMiddleware,userManageView)
router.get("/userManageApi", adminApiAuthMiddleware, userManageList);
router.patch("/userManage/:id/statusApi",adminApiAuthMiddleware, updateUserStatus);
router.post("/userManage/create",adminApiAuthMiddleware,createUser)
router.patch("/changePasswordApi", apiAuthMiddleware, changePassword);
module.exports=router