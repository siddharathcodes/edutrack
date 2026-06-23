const express = require("express");
const ctrl = require("../controllers/dailyReportController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/today", ctrl.getToday);
router.put("/today", ctrl.updateToday);
router.post("/today/todos", ctrl.addTodo);
router.post("/today/todos/:todoId/toggle", ctrl.toggleTodo);
router.delete("/today/todos/:todoId", ctrl.deleteTodo);

router.get("/admin", requireAdmin, ctrl.adminList);

module.exports = router;
