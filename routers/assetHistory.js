const express = require("express");
const pageAuthMiddleware = require("../middleware/pageMiddleware");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const { assetHistoryListView, assetHistoryListApi, assetHistoryView } = require("../controllers/assetHistory");

const router = express.Router();
router.get("/assetHistory",pageAuthMiddleware, assetHistoryListView);
router.get("/assetHistoryApi",apiAuthMiddleware, assetHistoryListApi);     
router.get("/assets/history/:id",pageAuthMiddleware, assetHistoryView);
module.exports=router