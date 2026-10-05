const express = require("express");
const pageAuthMiddleware = require("../middleware/pageMiddleware");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const { stockView, stockApi } = require("../controllers/stock");

const router = express.Router();

router.get("/stocks",pageAuthMiddleware, stockView);        // page (written next)
router.get("/stockApi",apiAuthMiddleware, stockApi); 

module.exports = router;