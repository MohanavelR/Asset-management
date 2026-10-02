// config for env file Data access
require("dotenv").config()

const express=require("express")
const {onDB}=require("./config/db")
const logger=require("./helpers/logger")
const path=require("path")
const ROOT_PATH=require("./utils/projectPath")

// create app 
function create_app(){
  try {
    
    const APP= express()
    //set template engine   
    APP.set("view engine","jade")
    APP.use(express.json())
    APP.use(express.urlencoded({extended:true}))
    //set templates files   
    APP.set("views",path.join(ROOT_PATH,"templates"))
    // set css file access  
    APP.use(express.static(path.join(ROOT_PATH,"public")))
  //   APP.use((req, res, next) => {
  //     res.locals.appName = "Asset Manage";
  //     res.locals.user = req.user || null;
  
  //     next();
  // });
    APP.get("/", (req, res) => {
      res.render("auth/setPassword");
  });
    return APP
  } catch (error) {
     logger.error(`${error.message}`);
  }
}
// ---------------

const app=create_app()


// Create server
async function startServer(){
 try {
   await onDB() 
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


