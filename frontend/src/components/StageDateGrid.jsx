import { fmtDate } from "../constants";

const DATE_STAGE_FIELDS = [
  { key: "date", label: "Applied" },
  { key: "intake", label: "Intake" },
  { key: "deferred", label: "Deferred" },
  { key: "olRequest", label: "OL Requested" },
  { key: "olReceived", label: "OL Received" },
  { key: "withdraw", label: "Withdraw/Cancel" },
  { key: "payment", label: "Payment" },
  { key: "visaLodgement", label: "Visa Lodgement" },
  { key: "visaOutcome", label: "Visa Outcome" },
  { key: "refund", label: "Refund" },
];

export default function StageDateGrid({ record }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px 18px", marginBottom: record.remarks || record.other ? 12 : 0 }}>
        {DATE_STAGE_FIELDS.map((f) => {
          const val = record[f.key];
          const isDate = val && !isNaN(new Date(val).getTime()) && /^\d{4}-\d{2}-\d{2}/.test(String(val));
          return (
            <div key={f.key}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9AA4BD", textTransform: "uppercase", letterSpacing: "0.03em" }}>{f.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: val ? "#1B2A4A" : "#C7CCDA", marginTop: 2 }}>
                {val ? (isDate ? fmtDate(val) : val) : "—"}
              </div>
            </div>
          );
        })}
      </div>
      {(record.other || record.remarks) && (
        <div style={{ borderTop: "1px solid #EFEAE0", paddingTop: 10, display: "flex", gap: 24 }}>
          {record.other && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9AA4BD", textTransform: "uppercase", letterSpacing: "0.03em" }}>Other</div>
              <div style={{ fontSize: 13, color: "#3B445C", marginTop: 2 }}>{record.other}</div>
            </div>
          )}
          {record.remarks && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9AA4BD", textTransform: "uppercase", letterSpacing: "0.03em" }}>Remarks</div>
              <div style={{ fontSize: 13, color: "#3B445C", marginTop: 2 }}>{record.remarks}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
