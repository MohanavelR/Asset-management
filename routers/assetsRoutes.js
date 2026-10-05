const {  addAssetView, createAsset, assetListView, assetsApi, editAssetView, updateAsset, viewAssetView, deleteAsset } = require("../controllers/asset");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const pageAuthMiddleware = require("../middleware/pageMiddleware");
const { assetValidation } = require("../middleware/validationMiddleware");

const router=require("express").Router()

router.get("/assets",pageAuthMiddleware,assetListView)
router.get("/assets/add",pageAuthMiddleware,addAssetView)
router.get("/assets/:id/edit",pageAuthMiddleware ,editAssetView); 
router.get("/assets/view/:id", pageAuthMiddleware,viewAssetView); 
router.get("/assetsApi",apiAuthMiddleware, assetsApi);
router.post("/addAssetApi",apiAuthMiddleware,createAsset)
router.delete("/deleteAssetApi/:id",apiAuthMiddleware, deleteAsset);
router.put("/updateAssetApi/:id",apiAuthMiddleware, assetValidation, updateAsset);

module.exports =router
