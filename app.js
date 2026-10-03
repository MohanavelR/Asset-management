// config for env file Data access
require("dotenv").config()

const express=require("express")
const cookieParser=require("cookie-parser")
const {onDB}=require("./config/db")
const logger=require("./helpers/logger")
const path=require("path")
const ROOT_PATH=require("./utils/projectPath")
const createAdmin = require("./helpers/createAdmin")
// routes

const authRouter=require("./routers/authRoutes")
const userRouter=require("./routers/userRoutes")
const employeeRouter=require("./routers/employeeRoutes")
const categoryRouter=require("./routers/assetCategory")
const authMiddleWare = require("./middleware/authMiddleware")
const apiErrorHandler = require("./helpers/apiErrorHandler")

// create app 
function create_app(){
  try {
    
    const APP= express()
    //set template engine   
    APP.set("view engine","jade")
    APP.use(express.json())
    APP.use(express.urlencoded({extended:true}))
    APP.use(cookieParser())
    //set templates files   
    APP.set("views",path.join(ROOT_PATH,"templates"))
    // set css file access  
    APP.use(express.static(path.join(ROOT_PATH,"public")))
    

  // 
    APP.use((req, res, next) => {
    logger.info(`${req.method} http://${req.get("host")}${req.originalUrl}`);
      next();
    });


    APP.use(authMiddleWare)
    APP.get("/",(req,res)=>{
      res.render("loading")
    })
    APP.use("/",authRouter)
    APP.use("/",userRouter)
    APP.use("/",employeeRouter)
    APP.use("/",categoryRouter)
    APP.use(apiErrorHandler)
    return APP
  } catch (error) {
     logger.error(`${error}`);
  }
}
// ---------------

const app=create_app()


// Create server
async function startServer(){
 try {
   await onDB() 
   
   await createAdmin()
   const PORT = process.env.PORT || 3000; 
   const HOST = process.env.HOST || "localhost"; 

   app.listen(PORT, HOST, () => { 
   logger.info( `Server started successfully URL: http://${HOST}:${PORT}` )
})
 } catch (error) {
   logger.error(`Failed to start server: ${error.message}`);
   process.exit(1);
 }
}
// ---------------------
   
if(require.main===module){
 startServer()  
}


