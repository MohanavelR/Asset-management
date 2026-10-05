const express = require("express");
const { issueAssetView, issuesApi, issueAsset } = require("../controllers/issueAsset");
const pageAuthMiddleware = require("../middleware/pageMiddleware");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const { issueValidation } = require("../middleware/validationMiddleware");
const router = express.Router();

router.get("/issueAssets",pageAuthMiddleware ,issueAssetView); 
router.get("/issuesApi",apiAuthMiddleware,issuesApi)
router.post("/issueAssetApi", issueValidation, issueAsset);  
module.exports=router