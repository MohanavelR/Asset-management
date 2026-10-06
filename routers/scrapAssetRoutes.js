const express = require("express");
const pageAuthMiddleware = require("../middleware/pageMiddleware");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const { scrapValidation } = require("../middleware/validationMiddleware");
const { scrapAsset, scrapAssetView, scrapListApi, restockAsset } = require("../controllers/scrapAsset");

const router = express.Router();

// ========= Page Routes ===========
router.get("/scrapAssets", pageAuthMiddleware, scrapAssetView);

// ========= API Routes ===========
router.get("/scrapListApi", apiAuthMiddleware, scrapListApi);
router.post("/scrapAssetApi", apiAuthMiddleware, scrapValidation, scrapAsset);
router.post("/restockAssetApi", apiAuthMiddleware, restockAsset);

module.exports = router;