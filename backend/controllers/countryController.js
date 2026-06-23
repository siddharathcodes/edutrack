const Country = require("../models/Country");

async function list(req, res) {
  const countries = await Country.find().sort({ name: 1 });
  res.json({ countries });
}

async function create(req, res) {
  const { name, flagEmoji } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Country name is required." });

  const existing = await Country.findOne({ name: name.trim() });
  if (existing) return res.status(409).json({ error: "That country already exists." });

  const country = await Country.create({ name: name.trim(), flagEmoji: flagEmoji || "🌐" });
  res.status(201).json({ country });
}

async function update(req, res) {
  const country = await Country.findById(req.params.id);
  if (!country) return res.status(404).json({ error: "Country not found." });

  const { name, flagEmoji, active } = req.body;
  if (name !== undefined) country.name = name.trim();
  if (flagEmoji !== undefined) country.flagEmoji = flagEmoji;
  if (active !== undefined) country.active = active;

  await country.save();
  res.json({ country });
}

async function remove(req, res) {
  // Soft-guard: don't hard-delete a country that still has applications, to avoid orphaned records.
  const Application = require("../models/Application");
  const country = await Country.findById(req.params.id);
  if (!country) return res.status(404).json({ error: "Country not found." });

  const count = await Application.countDocuments({ country: country.name });
  if (count > 0) {
    return res.status(400).json({
      error: `Can't delete "${country.name}" — it still has ${count} application(s). Mark it inactive instead, or move/delete those applications first.`,
    });
  }
  await country.deleteOne();
  res.json({ success: true });
}

module.exports = { list, create, update, remove };
