const express = require("express");
const ctrl = require("../controllers/notificationController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", ctrl.list);
router.post("/", requireAdmin, ctrl.create);
router.post("/:id/read", ctrl.markRead);
router.post("/read-all", ctrl.markAllRead);
router.delete("/:id", requireAdmin, ctrl.remove);
router.post("/generate-auto-alerts", requireAdmin, ctrl.generateAutoAlerts);

module.exports = router;
