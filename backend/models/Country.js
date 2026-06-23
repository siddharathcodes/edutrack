const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    flagEmoji: { type: String, default: "🌐" },
    active: { type: Boolean, default: true }, // inactive countries are hidden from new-application dropdowns but keep existing records
  },
  { timestamps: true }
);

module.exports = mongoose.model("Country", countrySchema);
