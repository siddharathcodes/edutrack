export const STAGE_ORDER = [
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

export const ACTIVE_STAGES = [
  "Initial / Applied",
  "OL Requested",
  "OL Received",
  "Payment Done",
  "Visa Lodged",
  "Visa Outcome",
];

export const STAGE_COLOR = {
  "Initial / Applied": "#8B93A6",
  "OL Requested": "#C98A1F",
  "OL Received": "#C98A1F",
  "Payment Done": "#2C6E9E",
  "Visa Lodged": "#2C6E9E",
  "Visa Outcome": "#2F8F5B",
  Refund: "#C44536",
  Deferred: "#9C5FAE",
  "Withdrawn/Cancelled": "#8B93A6",
};

export const LEVELS = ["UG", "PG", "Masters", "PG Certificate", "PGD", "Cert/Diploma", "Graduate Diploma", "Research/PHD"];

export const COUNTRIES = [
  "USA", "UK", "Australia", "France", "Canada", "New Zealand", "Denmark", "Finland",
  "UAE", "Austria", "Sweden", "Hungary", "Ireland", "Netherlands", "Malta", "Cyprus",
  "Spain", "Germany", "Poland", "India", "Uzbekistan", "Bangladesh",
];

export const COUNTRY_FLAG = {
  USA: "🇺🇸", UK: "🇬🇧", Australia: "🇦🇺", France: "🇫🇷", Canada: "🇨🇦",
  "New Zealand": "🇳🇿", Denmark: "🇩🇰", Finland: "🇫🇮", UAE: "🇦🇪", Austria: "🇦🇹",
  Sweden: "🇸🇪", Hungary: "🇭🇺", Ireland: "🇮🇪", Netherlands: "🇳🇱", Malta: "🇲🇹",
  Cyprus: "🇨🇾", Spain: "🇪🇸", Germany: "🇩🇪", Poland: "🇵🇱", India: "🇮🇳",
  Uzbekistan: "🇺🇿", Bangladesh: "🇧🇩",
};

export function fmtDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function toInputDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
