// One-time setup: populates the Country collection so the country list becomes
// database-driven (Admin can add/remove countries from the UI afterwards).
// Run with: node scripts/seedCountries.js
require("dotenv").config();
const connectDB = require("../config/db");
const Country = require("../models/Country");
const Application = require("../models/Application");

const FLAGS = {
  USA: "🇺🇸", UK: "🇬🇧", Australia: "🇦🇺", France: "🇫🇷", Canada: "🇨🇦",
  "New Zealand": "🇳🇿", Denmark: "🇩🇰", Finland: "🇫🇮", UAE: "🇦🇪", Austria: "🇦🇹",
  Sweden: "🇸🇪", Hungary: "🇭🇺", Ireland: "🇮🇪", Netherlands: "🇳🇱", Malta: "🇲🇹",
  Cyprus: "🇨🇾", Spain: "🇪🇸", Germany: "🇩🇪", Poland: "🇵🇱", India: "🇮🇳",
  Uzbekistan: "🇺🇿", Bangladesh: "🇧🇩",
};

async function run() {
  await connectDB();

  // Pull distinct countries already present in Application records, so nothing existing is orphaned.
  const existingCountries = await Application.distinct("country");
  const allNames = new Set([...existingCountries, ...Object.keys(FLAGS)]);

  let created = 0;
  for (const name of allNames) {
    const exists = await Country.findOne({ name });
    if (exists) continue;
    await Country.create({ name, flagEmoji: FLAGS[name] || "🌐" });
    created++;
  }

  console.log(`Done. Created ${created} country record(s). Total countries: ${await Country.countDocuments()}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
