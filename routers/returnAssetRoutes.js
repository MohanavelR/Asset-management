const express = require("express");
const pageAuthMiddleware = require("../middleware/pageMiddleware");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const { returnValidation } = require("../middleware/validationMiddleware");
const { returnAssetView, returnsApi, returnAsset } = require("../controllers/returnAsset");


const router = express.Router();

router.get("/returnAssets",pageAuthMiddleware, returnAssetView);                      // page
router.get("/returnsApi", apiAuthMiddleware,returnsApi);                            // table data
router.post("/returnAssetApi", apiAuthMiddleware,returnValidation, returnAsset);    // save 
module.exports=router