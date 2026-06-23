// One-time migration: imports every country sheet from the UCA Excel workbook
// (Application_Details_2082_83.xlsx) into the Application collection.
//
// Usage:
//   node scripts/migrate.js /path/to/Application_Details_2082_83.xlsx
//
// Safe to re-run: pass --wipe to clear the Application collection first,
// otherwise records are only inserted (running twice without --wipe will duplicate rows).

require("dotenv").config();
const path = require("path");
const XLSX = require("xlsx");
const connectDB = require("../config/db");
const Application = require("../models/Application");

// Column index map per sheet, after skipping the first 2 header rows (0-indexed).
// Columns 0,1,2 are always Date, Referred by, Name of Applicant.
const SHEET_MAP = {
  USA:        { level:3, course:4, provider:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14, other:15 },
  UK:         { level:3, course:4, provider:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaOutcome:12, refund:13, other:15, remarks:16 },
  Australia:  { level:3, course:4, provider:5, portal:6, intake:7, deferred:8, olRequest:9, olReceived:10, withdraw:11, gsSubmission:12, payment:13, coe:14, visaLodgement:15, visaOutcome:16, refund:17, other:18 },
  France:     { level:3, course:4, provider:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14 },
  Canada:     { level:3, course:4, provider:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14, other:15 },
  "New Zealand": { level:3, academicScore:4, elpScore:5, provider:6, portal:7, course:8, intake:9, deferred:10, olRequest:11, olReceived:12, withdraw:13, payment:14, visaLodgement:15, visaOutcome:16, refund:17, remarks:18 },
  Denmark:    { level:3, provider:4, course:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14 },
  Finland:    { level:3, course:4, provider:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14, other:15 },
  UAE:        { level:3, course:4, provider:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14, other:15 },
  Austria:    { level:3, course:4, provider:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14 },
  Sweden:     { level:3, provider:4, course:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14 },
  Hungary:    { level:3, provider:4, course:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14 },
  Ireland:    { level:3, provider:4, course:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14 },
  Netherlands:{ level:3, course:4, provider:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14, other:15 },
  Malta:      { level:3, provider:4, course:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14 },
  Cyprus:     { level:3, course:4, provider:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14 },
  Spain:      { level:3, course:4, provider:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14 },
  Germany:    { level:3, course:4, provider:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14 },
  Poland:     { level:3, provider:4, course:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14 },
  India:      { level:3, provider:4, course:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, commencementDate:12, remarks:13, refund:14 },
  Uzbekistan: { level:3, provider:4, course:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14 },
  Bangladesh: { level:3, provider:4, course:5, intake:6, deferred:7, olRequest:8, olReceived:9, withdraw:10, payment:11, visaLodgement:12, visaOutcome:13, refund:14 },
};

const VALID_LEVELS = ["UG", "PG", "Masters", "PG Certificate", "PGD", "Cert/Diploma", "Graduate Diploma", "Research/PHD"];

function excelDateToJsDate(value) {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(value);
    if (!d) return null;
    return new Date(d.y, d.m - 1, d.d);
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null; // free-text values that aren't real dates are kept in remarks/other instead
}

function cellText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

// Decides the pipeline stage from which date columns are filled, in priority order.
function deriveStage(rec) {
  if (rec.refund) return "Refund";
  if (rec.visaOutcome) return "Visa Outcome";
  if (rec.visaLodgement) return "Visa Lodged";
  if (rec.withdraw) return "Withdrawn/Cancelled";
  if (rec.deferred) return "Deferred";
  if (rec.payment) return "Payment Done";
  if (rec.olReceived) return "OL Received";
  if (rec.olRequest) return "OL Requested";
  return "Initial / Applied";
}

function normalizeLevel(raw) {
  const v = cellText(raw);
  if (VALID_LEVELS.includes(v)) return v;
  const lower = v.toLowerCase();
  if (lower.startsWith("ug")) return "UG";
  if (lower.startsWith("pg cert")) return "PG Certificate";
  if (lower.startsWith("pgd")) return "PGD";
  if (lower.startsWith("pg")) return "PG";
  if (lower.includes("master")) return "Masters";
  if (lower.includes("research") || lower.includes("phd")) return "Research/PHD";
  if (lower.includes("diploma")) return "Cert/Diploma";
  return "UG"; // safe default; can be corrected later from the UI
}

function parseSheet(workbook, sheetName) {
  const map = SHEET_MAP[sheetName];
  if (!map) {
    console.warn(`  No column map defined for "${sheetName}" — skipping.`);
    return [];
  }
  const ws = workbook.Sheets[sheetName];
  if (!ws) return [];

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  const dataRows = rows.slice(2); // skip the 2 header rows

  const records = [];
  for (const row of dataRows) {
    const name = cellText(row[2]);
    if (!name) continue; // skip blank / spacer rows

    const rec = {
      country: sheetName,
      date: excelDateToJsDate(row[0]),
      referredBy: cellText(row[1]) || null,
      name,
      level: normalizeLevel(row[map.level]),
      course: cellText(row[map.course]) || null,
      provider: cellText(row[map.provider]) || null,
      intake: cellText(row[map.intake]) || null,
      deferred: excelDateToJsDate(row[map.deferred]),
      olRequest: excelDateToJsDate(row[map.olRequest]),
      olReceived: excelDateToJsDate(row[map.olReceived]),
      withdraw: excelDateToJsDate(row[map.withdraw]),
      payment: excelDateToJsDate(row[map.payment]),
      visaLodgement: excelDateToJsDate(row[map.visaLodgement]),
      visaOutcome: excelDateToJsDate(row[map.visaOutcome]),
      refund: excelDateToJsDate(row[map.refund]),
      other: cellText(row[map.other]) || null,
      remarks: cellText(row[map.remarks]) || null,
    };

    // India's sheet has Commencement Date instead of Visa Lodgement — preserve it in remarks
    // so the information isn't lost, since the schema doesn't have a dedicated field for it.
    if (map.commencementDate !== undefined) {
      const commencement = cellText(row[map.commencementDate]);
      if (commencement) {
        rec.remarks = rec.remarks ? `${rec.remarks} | Commencement: ${commencement}` : `Commencement: ${commencement}`;
      }
    }

    rec.stage = deriveStage(rec);
    records.push(rec);
  }
  return records;
}

async function run() {
  const filePath = process.argv[2];
  const wipe = process.argv.includes("--wipe");

  if (!filePath) {
    console.error("Usage: node scripts/migrate.js /path/to/Application_Details_2082_83.xlsx [--wipe]");
    process.exit(1);
  }

  await connectDB();

  if (wipe) {
    const { deletedCount } = await Application.deleteMany({});
    console.log(`Wiped ${deletedCount} existing application(s).`);
  }

  const workbook = XLSX.readFile(path.resolve(filePath));
  let totalInserted = 0;

  for (const sheetName of Object.keys(SHEET_MAP)) {
    if (!workbook.SheetNames.includes(sheetName)) {
      console.log(`Sheet "${sheetName}" not found in workbook — skipping.`);
      continue;
    }
    const records = parseSheet(workbook, sheetName);
    if (records.length === 0) {
      console.log(`${sheetName}: 0 records.`);
      continue;
    }
    await Application.insertMany(records, { ordered: false });
    console.log(`${sheetName}: imported ${records.length} record(s).`);
    totalInserted += records.length;
  }

  console.log(`\nDone. Imported ${totalInserted} application(s) total.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
