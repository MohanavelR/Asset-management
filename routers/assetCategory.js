const express = require("express");
const { assetCategoryView, createAssetCategory, updateAssetCategory, deleteAssetCategory } = require("../controllers/assetCategory");
const { assetCategoryValidation } = require("../middleware/validationMiddleware");

const router = express.Router();

router.get("/asset-categories", assetCategoryView);

router.post("/asset-categories", assetCategoryValidation, createAssetCategory);
router.put("/asset-categories/:id", assetCategoryValidation, updateAssetCategory);
router.delete("/asset-categories/:id", deleteAssetCategory);

module.exports = router;