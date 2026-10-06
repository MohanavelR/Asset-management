const express = require("express");
const pageAuthMiddleware = require("../middleware/pageMiddleware");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const { stockView, stockApi } = require("../controllers/stock");

const router = express.Router();

// ========= Page Routes ===========
router.get("/stocks", pageAuthMiddleware, stockView);

// ========= API Routes ===========
router.get("/stockApi", apiAuthMiddleware, stockApi);

module.exports = router;