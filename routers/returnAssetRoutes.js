const express = require("express");
const pageAuthMiddleware = require("../middleware/pageMiddleware");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const { returnValidation } = require("../middleware/validationMiddleware");
const { returnAssetView, returnsApi, returnAsset } = require("../controllers/returnAsset");

const router = express.Router();

// ========= Page Routes ===========
router.get("/returnAssets", pageAuthMiddleware, returnAssetView);

// ========= API Routes ===========
router.get("/returnsApi", apiAuthMiddleware, returnsApi);
router.post("/returnAssetApi", apiAuthMiddleware, returnValidation, returnAsset);

module.exports = router;