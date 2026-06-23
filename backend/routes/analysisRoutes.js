const express = require("express");
const ctrl = require("../controllers/analysisController");
const { requireAuth, scopeToUserCountries } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, scopeToUserCountries);

router.get("/", ctrl.generateAnalysis);

module.exports = router;
