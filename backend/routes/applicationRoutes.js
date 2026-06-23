const express = require("express");
const ctrl = require("../controllers/applicationController");
const { requireAuth, scopeToUserCountries } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, scopeToUserCountries);

router.get("/stats/dashboard", ctrl.dashboardStats);
router.get("/", ctrl.list);
router.get("/:id", ctrl.getOne);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);
router.post("/bulk/stage", ctrl.bulkUpdateStage);
router.post("/bulk/delete", ctrl.bulkDelete);

module.exports = router;
