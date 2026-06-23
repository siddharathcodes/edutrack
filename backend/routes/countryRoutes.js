const express = require("express");
const ctrl = require("../controllers/countryController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", ctrl.list); // any logged-in user can read the country list (needed for dropdowns)
router.post("/", requireAdmin, ctrl.create);
router.put("/:id", requireAdmin, ctrl.update);
router.delete("/:id", requireAdmin, ctrl.remove);

module.exports = router;
