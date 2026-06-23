const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { _id: true }
);

// Stores a snapshot of the report text every time it's edited, so the original
// version is never lost — only Admin can see this history; staff only see the latest.
const revisionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    editedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const dailyReportSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Stored as a plain YYYY-MM-DD string (set automatically to "today" on creation) so there's
    // exactly one report per staff per calendar day, and querying by date is simple.
    date: { type: String, required: true },

    text: { type: String, default: "" }, // current/latest version of the free-text report
    revisions: { type: [revisionSchema], default: [] }, // full history, admin-only

    todos: { type: [todoSchema], default: [] },

    // Auto-pulled stats (snapshotted at end of day, or on demand) — what this staff member
    // actually did, derived from Application records they touched today.
    autoStats: {
      applicationsAdded: { type: Number, default: 0 },
      applicationsUpdated: { type: Number, default: 0 },
      stageMovesCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

dailyReportSchema.index({ staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyReport", dailyReportSchema);
