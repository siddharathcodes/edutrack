const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT on the request and attaches the user to req.user
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Not logged in." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user || !user.active) {
      return res.status(401).json({ error: "Account not found or disabled." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
  }
}

// Only allows admins through
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admins only." });
  }
  next();
}

// Restricts which countries a non-admin can act on.
// Admin: unrestricted. Staff: only their assigned countries.
function scopeToUserCountries(req, res, next) {
  if (req.user.role === "admin") {
    req.allowedCountries = null; // null = no restriction
  } else {
    req.allowedCountries = req.user.countries || [];
  }
  next();
}

module.exports = { requireAuth, requireAdmin, scopeToUserCountries };
