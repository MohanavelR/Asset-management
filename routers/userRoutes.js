const { dashboardView } = require("../controllers/user");
const authMiddleWare = require("../middleware/authMiddleware");
const pageAuthMiddleware = require("../middleware/pageMiddleware");

const router=require("express").Router()
router.get("/dashboard",pageAuthMiddleware,dashboardView);
module.exports=router