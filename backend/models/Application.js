const mongoose = require("mongoose");

const STAGES = [
  "Initial / Applied",
  "OL Requested",
  "OL Received",
  "Payment Done",
  "Visa Lodged",
  "Visa Outcome",
  "Refund",
  "Deferred",
  "Withdrawn/Cancelled",
];

const LEVELS = ["UG", "PG", "Masters", "PG Certificate", "PGD", "Cert/Diploma", "Graduate Diploma", "Research/PHD"];

const applicationSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true, index: true }, // doubles as "department"
    name: { type: String, required: true, trim: true },
    level: { type: String, enum: LEVELS, default: "UG" },
    course: { type: String, trim: true },
    provider: { type: String, trim: true },
    referredBy: { type: String, trim: true },

    date: { type: Date }, // date applied
    intake: { type: String, trim: true }, // free text: sheet had both dates and "Fall 2026" style values

    stage: { type: String, enum: STAGES, default: "Initial / Applied", index: true },

    // Individual stage dates, mirroring the original Excel columns
    deferred: { type: Date },
    olRequest: { type: Date },
    olReceived: { type: Date },
    withdraw: { type: Date },
    payment: { type: Date },
    visaLodgement: { type: Date },
    visaOutcome: { type: Date },
    refund: { type: Date },

    other: { type: String, trim: true },
    remarks: { type: String, trim: true },

    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

applicationSchema.index({ name: "text", course: "text", provider: "text", referredBy: "text" });

module.exports = mongoose.model("Application", applicationSchema);
module.exports.STAGES = STAGES;
module.exports.LEVELS = LEVELS;
