const express = require("express");
const pageAuthMiddleware = require("../middleware/pageMiddleware");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const { assetHistoryListView, assetHistoryListApi, assetHistoryView } = require("../controllers/assetHistory");

const router = express.Router();

// ========= Page Routes ===========
router.get("/assetHistory", pageAuthMiddleware, assetHistoryListView);
router.get("/assets/history/:id", pageAuthMiddleware, assetHistoryView);

// ========= API Routes ===========
router.get("/assetHistoryApi", apiAuthMiddleware, assetHistoryListApi);

module.exports = router;