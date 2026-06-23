// One-time setup: creates the first Admin login from values in .env
// Run with: npm run seed:users
require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");

async function run() {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const name = process.env.ADMIN_NAME || "Admin";
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running this script.");
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists for ${email}. Nothing to do.`);
    process.exit(0);
  }

  const user = new User({ name, email, role: "admin", countries: [] });
  await user.setPassword(password);
  await user.save();

  console.log(`Created admin user: ${email}`);
  console.log("Log in with this email and the password you set in .env, then change it.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
