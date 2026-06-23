const DailyReport = require("../models/DailyReport");
const Application = require("../models/Application");

function todayStr() {
  // Server-local date as YYYY-MM-DD. Good enough for a single-office tool; if UCA ever
  // has staff across very different time zones, switch this to a per-user timezone offset.
  return new Date().toISOString().slice(0, 10);
}

// Computes "what this staff member actually did today" from Application audit fields,
// so the daily report isn't purely self-reported.
async function computeAutoStats(staffId, dateStr) {
  const start = new Date(dateStr + "T00:00:00.000Z");
  const end = new Date(dateStr + "T23:59:59.999Z");

  const [added, updated] = await Promise.all([
    Application.countDocuments({ createdBy: staffId, createdAt: { $gte: start, $lte: end } }),
    Application.countDocuments({ updatedBy: staffId, updatedAt: { $gte: start, $lte: end }, createdAt: { $lt: start } }),
  ]);

  return { applicationsAdded: added, applicationsUpdated: updated, stageMovesCount: updated };
}

// Staff: get (or auto-create) today's report for themselves.
async function getToday(req, res) {
  const date = todayStr();
  let report = await DailyReport.findOne({ staff: req.user._id, date });
  if (!report) {
    report = await DailyReport.create({ staff: req.user._id, date, text: "", todos: [], revisions: [] });
  }
  const autoStats = await computeAutoStats(req.user._id, date);
  report.autoStats = autoStats;
  await report.save();

  // Staff view never includes revision history — only the latest text.
  const { revisions, ...rest } = report.toObject();
  res.json({ report: rest });
}

// Staff: update today's report text. Previous text is pushed into revisions, never deleted.
async function updateToday(req, res) {
  const { text } = req.body;
  const date = todayStr();
  let report = await DailyReport.findOne({ staff: req.user._id, date });
  if (!report) {
    report = new DailyReport({ staff: req.user._id, date, text: "", todos: [], revisions: [] });
  }

  if (report.text && report.text !== text) {
    report.revisions.push({ text: report.text, editedAt: new Date() });
  }
  report.text = text || "";
  await report.save();

  const { revisions, ...rest } = report.toObject();
  res.json({ report: rest });
}

// Staff: todo management for today's report.
async function addTodo(req, res) {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "Todo text is required." });
  const date = todayStr();
  let report = await DailyReport.findOne({ staff: req.user._id, date });
  if (!report) report = new DailyReport({ staff: req.user._id, date });
  report.todos.push({ text: text.trim(), done: false, createdAt: new Date() });
  await report.save();
  const { revisions, ...rest } = report.toObject();
  res.json({ report: rest });
}

async function toggleTodo(req, res) {
  const date = todayStr();
  const report = await DailyReport.findOne({ staff: req.user._id, date });
  if (!report) return res.status(404).json({ error: "Today's report not found." });
  const todo = report.todos.id(req.params.todoId);
  if (!todo) return res.status(404).json({ error: "Todo not found." });
  todo.done = !todo.done;
  todo.completedAt = todo.done ? new Date() : null;
  await report.save();
  const { revisions, ...rest } = report.toObject();
  res.json({ report: rest });
}

async function deleteTodo(req, res) {
  const date = todayStr();
  const report = await DailyReport.findOne({ staff: req.user._id, date });
  if (!report) return res.status(404).json({ error: "Today's report not found." });
  report.todos = report.todos.filter((t) => t._id.toString() !== req.params.todoId);
  await report.save();
  const { revisions, ...rest } = report.toObject();
  res.json({ report: rest });
}

// Admin: list reports across all staff, optionally filtered by date range / staff / country.
async function adminList(req, res) {
  const { dateFrom, dateTo, staffId } = req.query;
  const filter = {};
  if (staffId) filter.staff = staffId;
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = dateFrom;
    if (dateTo) filter.date.$lte = dateTo;
  }
  const reports = await DailyReport.find(filter).sort({ date: -1 }).populate("staff", "name email countries");
  res.json({ reports }); // admin gets full documents, including revisions
}

module.exports = { getToday, updateToday, addTodo, toggleTodo, deleteTodo, adminList };
