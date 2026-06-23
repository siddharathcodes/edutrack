const User = require("../models/User");

async function list(req, res) {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({ users });
}

async function create(req, res) {
  const { name, email, password, role, countries } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ error: "A user with that email already exists." });
  }
  const user = new User({
    name,
    email: email.toLowerCase().trim(),
    role: role === "admin" ? "admin" : "staff",
    countries: role === "admin" ? [] : countries || [],
  });
  await user.setPassword(password);
  await user.save();
  res.status(201).json({ user });
}

async function update(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });

  const { name, role, countries, active, password } = req.body;
  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (countries !== undefined) user.countries = countries;
  if (active !== undefined) user.active = active;
  if (password) await user.setPassword(password);

  await user.save();
  res.json({ user });
}

async function remove(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  if (user.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin", active: true });
    if (adminCount <= 1) {
      return res.status(400).json({ error: "Can't remove the last remaining admin." });
    }
  }
  await user.deleteOne();
  res.json({ success: true });
}

module.exports = { list, create, update, remove };
