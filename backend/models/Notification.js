const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["manual", "auto"], default: "manual" },
    severity: { type: String, enum: ["info", "warning", "urgent"], default: "info" },

    // Who sent it (null for system-generated auto alerts)
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Who should see it. Empty array = everyone (broadcast).
    recipients: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    // Optional: scope a notice to a country/department instead of named people.
    country: { type: String, default: null },

    // Optional link back to a specific application this notice is about (e.g. an auto-alert).
    relatedApplication: { type: mongoose.Schema.Types.ObjectId, ref: "Application", default: null },

    // Per-user read tracking, since one notice can have many recipients.
    readBy: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
