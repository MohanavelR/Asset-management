const jwt = require("jsonwebtoken");
const User  = require("../models/user");
const logger=require("../helpers/logger");
const { tokenVerify } = require("../helpers/token");

async function authMiddleWare(req,res,next) {
    req.user=null
    req.isAuthenticated=false
    try {
       const token = req?.cookies?.token
      
       if(token){
         const decoded=await tokenVerify(token)
         const user=await User.findByPk(decoded.id,{attributes:{exclude:["password"]}})
        
         if(user && user?.isActive){
            req.user=user
            req.isAuthenticated=true
         }
         else{
           res.clearCookie("token")
         }
       }

    } catch (error) {
         logger.error(error)
    }
    res.locals.appName = "Asset Management";
    res.locals.user = req.user || null;
    res.locals.isAuthenticated = req.isAuthenticated || false;
    next();
}

module.exports=authMiddleWare