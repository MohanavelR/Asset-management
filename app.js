require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

const { onDB } = require("./config/db");
const logger = require("./helpers/logger");
const ROOT_PATH = require("./utils/projectPath");
const createAdmin = require("./helpers/createAdmin");
const { BRANCHES } = require("./config/contants");

// ========= Routers ===========
const authRouter = require("./routers/authRoutes");
const userRouter = require("./routers/userRoutes");
const employeeRouter = require("./routers/employeeRoutes");
const assetRouter = require("./routers/assetsRoutes");
const stockRouter = require("./routers/stockRoutes");
const categoryRouter = require("./routers/assetCategory");
const issueAssetRouter = require("./routers/issueAssetRoutes");
const returnAssetRouter = require("./routers/returnAssetRoutes");
const scrapAssetRouter = require("./routers/scrapAssetRoutes");
const assetHistoryRouter = require("./routers/assetHistory");

// ========= Middlewares ===========
const authMiddleWare = require("./middleware/authMiddleware");
const apiErrorHandler = require("./helpers/apiErrorHandler");

// ========= Create App ===========
function create_app() {
  try {
    const APP = express();

    // Template engine setup
    APP.set("view engine", "jade");
    APP.set("views", path.join(ROOT_PATH, "templates"));

    // Middlewares & Static files
    APP.use(express.json());
    APP.use(express.urlencoded({ extended: true }));
    APP.use(cookieParser());
    APP.use(express.static(path.join(ROOT_PATH, "public")));

    // Logger middleware
    APP.use((req, res, next) => {
      logger.info(`${req.method} http://${req.get("host")}${req.originalUrl}`);
      next();
    });

    // App locals
    APP.locals.branches = BRANCHES;

    // Authentication middleware
    APP.use(authMiddleWare);

    // Default route
    APP.get("/", (req, res) => {
      res.render("loading");
    });

    // Routes
    APP.use("/", authRouter);
    APP.use("/", userRouter);
    APP.use("/", assetRouter);
    APP.use("/", employeeRouter);
    APP.use("/", categoryRouter);
    APP.use("/", stockRouter);
    APP.use("/", issueAssetRouter);
    APP.use("/", returnAssetRouter);
    APP.use("/", scrapAssetRouter);
    APP.use("/", assetHistoryRouter);

    
    APP.use((req, res, next) => {
      res.status(404).render("error", { error: { message: "Page Not Found", statusCode: 404 } });
    });

    // Error handler
    APP.use(apiErrorHandler);

    return APP;
  } catch (error) {
    logger.error(`${error}`);
  }
}

const app = create_app();

// ========= Start Server ===========
async function startServer() {
  try {
    await onDB();
    await createAdmin();

    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || "localhost";

    app.listen(PORT, HOST, () => {
      logger.info(`Server started successfully URL: http://${HOST}:${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}