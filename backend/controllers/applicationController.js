const Application = require("../models/Application");

// Builds the base Mongo filter that enforces a staff member's country access.
// req.allowedCountries is set by the scopeToUserCountries middleware (null = admin, no restriction).
function baseScopeFilter(req) {
  if (req.allowedCountries === null) return {};
  return { country: { $in: req.allowedCountries } };
}

// Throws-as-response if a staff member tries to touch a country outside their scope.
function assertCountryAllowed(req, res, country) {
  if (req.allowedCountries !== null && !req.allowedCountries.includes(country)) {
    res.status(403).json({ error: `You don't have access to ${country}.` });
    return false;
  }
  return true;
}

async function list(req, res) {
  const scope = baseScopeFilter(req);
  const { country, stage, level, search, sortBy = "date", sortDir = "desc", page = 1, limit = 100, dateFrom, dateTo } = req.query;

  const filter = { ...scope };
  if (country && country !== "All") filter.country = country;
  if (stage && stage !== "All") filter.stage = stage;
  if (level && level !== "All") filter.level = level;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { course: { $regex: search, $options: "i" } },
      { provider: { $regex: search, $options: "i" } },
      { referredBy: { $regex: search, $options: "i" } },
    ];
  }
  // Date range filter (applies to the "date applied" field). dateFrom/dateTo are ISO date strings (YYYY-MM-DD).
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999); // include the whole end day
      filter.date.$lte = end;
    }
  }

  const sort = { [sortBy]: sortDir === "asc" ? 1 : -1 };
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [rows, total] = await Promise.all([
    Application.find(filter).sort(sort).skip(skip).limit(Number(limit)).populate("counsellor", "name email"),
    Application.countDocuments(filter),
  ]);

  res.json({ rows, total, page: Number(page), limit: Number(limit) });
}

async function getOne(req, res) {
  const app = await Application.findOne({ _id: req.params.id, ...baseScopeFilter(req) });
  if (!app) return res.status(404).json({ error: "Application not found." });
  res.json({ application: app });
}

async function create(req, res) {
  const data = req.body;
  if (!assertCountryAllowed(req, res, data.country)) return;

  const app = await Application.create({
    ...data,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });
  res.status(201).json({ application: app });
}

async function update(req, res) {
  const existing = await Application.findOne({ _id: req.params.id, ...baseScopeFilter(req) });
  if (!existing) return res.status(404).json({ error: "Application not found." });

  const nextCountry = req.body.country || existing.country;
  if (!assertCountryAllowed(req, res, nextCountry)) return;

  Object.assign(existing, req.body, { updatedBy: req.user._id });
  await existing.save();
  res.json({ application: existing });
}

async function remove(req, res) {
  const existing = await Application.findOne({ _id: req.params.id, ...baseScopeFilter(req) });
  if (!existing) return res.status(404).json({ error: "Application not found." });
  await existing.deleteOne();
  res.json({ success: true });
}

// Bulk move a set of applications to a new stage. Staff can only affect rows in their countries.
async function bulkUpdateStage(req, res) {
  const { ids, stage } = req.body;
  if (!Array.isArray(ids) || !ids.length || !stage) {
    return res.status(400).json({ error: "ids[] and stage are required." });
  }
  const filter = { _id: { $in: ids }, ...baseScopeFilter(req) };
  const result = await Application.updateMany(filter, { stage, updatedBy: req.user._id });
  res.json({ matched: result.matchedCount, modified: result.modifiedCount });
}

async function bulkDelete(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ error: "ids[] is required." });
  }
  const filter = { _id: { $in: ids }, ...baseScopeFilter(req) };
  const result = await Application.deleteMany(filter);
  res.json({ deleted: result.deletedCount });
}

async function dashboardStats(req, res) {
  const scope = baseScopeFilter(req);
  const { country, dateFrom, dateTo } = req.query;

  const filter = { ...scope };
  if (country && country !== "All") filter.country = country;
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  const [byStage, byCountry, total] = await Promise.all([
    Application.aggregate([{ $match: filter }, { $group: { _id: "$stage", count: { $sum: 1 } } }]),
    Application.aggregate([{ $match: filter }, { $group: { _id: "$country", count: { $sum: 1 } } }]),
    Application.countDocuments(filter),
  ]);
  res.json({ total, byStage, byCountry });
}

module.exports = { list, getOne, create, update, remove, bulkUpdateStage, bulkDelete, dashboardStats };
