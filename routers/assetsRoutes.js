const express = require("express");
const {
  addAssetView,
  createAsset,
  assetListView,
  assetsApi,
  editAssetView,
  updateAsset,
  viewAssetView,
  deleteAsset,
} = require("../controllers/asset");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const pageAuthMiddleware = require("../middleware/pageMiddleware");
const { assetValidation } = require("../middleware/validationMiddleware");

const router = express.Router();

// ========= Page Routes ===========
router.get("/assets", pageAuthMiddleware, assetListView);
router.get("/assets/add", pageAuthMiddleware, addAssetView);
router.get("/assets/:id/edit", pageAuthMiddleware, editAssetView);
router.get("/assets/view/:id", pageAuthMiddleware, viewAssetView);

// ========= API Routes ===========
router.get("/assetsApi", apiAuthMiddleware, assetsApi);
router.post("/addAssetApi", apiAuthMiddleware, assetValidation, createAsset);
router.put("/updateAssetApi/:id", apiAuthMiddleware, assetValidation, updateAsset);
router.delete("/deleteAssetApi/:id", apiAuthMiddleware, deleteAsset);

module.exports = router;