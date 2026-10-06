const express = require("express");
const { assetCategoryView, createAssetCategory, updateAssetCategory, deleteAssetCategory, categoryList } = require("../controllers/assetCategory");
const { assetCategoryValidation } = require("../middleware/validationMiddleware");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const pageAuthMiddleware = require("../middleware/pageMiddleware");

const router = express.Router();

// ========= Page Routes ===========
router.get("/asset-categories", pageAuthMiddleware, assetCategoryView);

// ========= API Routes ===========
router.get("/asset-categoriesApi", apiAuthMiddleware, categoryList);
router.post("/asset-categoriesApi", apiAuthMiddleware, assetCategoryValidation, createAssetCategory);
router.put("/asset-categoriesApi/:id", apiAuthMiddleware, assetCategoryValidation, updateAssetCategory);
router.delete("/asset-categoriesApi/:id", apiAuthMiddleware, deleteAssetCategory);

module.exports = router;