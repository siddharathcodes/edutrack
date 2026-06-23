import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Printer, X, Globe2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApplicationsAPI } from "../api/endpoints";
import { fmtDate } from "../constants";

export default function PrintPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user.role === "admin";
  const generatedOn = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    const idsRaw = sessionStorage.getItem("edutrack_print_ids");
    if (!idsRaw) {
      navigate("/applications");
      return;
    }
    const ids = JSON.parse(idsRaw);

    // The list endpoint doesn't support an "ids in" filter directly, so fetch each by id.
    // For typical print batches (tens to low hundreds of rows) this is fine.
    Promise.all(ids.map((id) => ApplicationsAPI.get(id).then((r) => r.application).catch(() => null)))
      .then((results) => setRows(results.filter(Boolean)))
      .catch((err) => setError(err.response?.data?.error || "Couldn't load records to print."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 30, color: "#7A8299" }}>Preparing print view…</p>;
  if (error) return <p style={{ padding: 30, color: "#C44536" }}>{error}</p>;

  return (
    <div style={{ background: "#fff", minHeight: "100vh", color: "#1B2A4A" }}>
      <div className="no-print" style={{ position: "sticky", top: 0, background: "#1B2A4A", padding: "14px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
        <span style={{ color: "#FAF8F3", fontSize: 14, fontWeight: 600 }}>
          Print preview — {rows.length} record(s) — {isAdmin ? "Admin" : "Staff"} layout
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, border: "none", background: "#E0922F", color: "#1B2A4A", fontSize: 13.5, fontWeight: 700 }}>
            <Printer size={15} /> Print / Save PDF
          </button>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, border: "none", background: "#2E3F63", color: "#FAF8F3", fontSize: 13.5, fontWeight: 600 }}>
            <X size={15} /> Close
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #1B2A4A", paddingBottom: 14, marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: "#E0922F", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Globe2 size={14} color="#1B2A4A" />
              </div>
              <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 700 }}>EduTrack</span>
            </div>
            <p style={{ fontSize: 12.5, color: "#7A8299", margin: "4px 0 0" }}>UniConsultants Alliance — Application Report</p>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: "#7A8299" }}>
            <div>Generated {generatedOn}</div>
            <div>{rows.length} application{rows.length !== 1 ? "s" : ""}</div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
          <thead>
            <tr style={{ background: "#F1EDE3" }}>
              <th style={printTh}>Applicant</th>
              <th style={printTh}>Country</th>
              <th style={printTh}>Course / Provider</th>
              <th style={printTh}>Level</th>
              <th style={printTh}>Applied</th>
              <th style={printTh}>Stage</th>
              {isAdmin && <th style={printTh}>Referred by</th>}
              {isAdmin && <th style={printTh}>Remarks</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} style={{ borderBottom: "1px solid #E4DFD4" }}>
                <td style={printTd}><strong>{r.name}</strong></td>
                <td style={printTd}>{r.country}</td>
                <td style={printTd}>
                  {r.course}
                  <br />
                  <span style={{ color: "#7A8299" }}>{r.provider}</span>
                </td>
                <td style={printTd}>{r.level}</td>
                <td style={printTd}>{fmtDate(r.date)}</td>
                <td style={printTd}>{r.stage}</td>
                {isAdmin && <td style={printTd}>{r.referredBy || "—"}</td>}
                {isAdmin && <td style={printTd}>{r.remarks || "—"}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {!isAdmin && (
          <p style={{ fontSize: 11, color: "#9AA4BD", marginTop: 18, fontStyle: "italic" }}>
            Staff print view excludes referral and internal remarks columns. Admins can print the full report including agent and remarks data.
          </p>
        )}
      </div>
    </div>
  );
}

const printTh = { textAlign: "left", padding: "8px 10px", fontWeight: 700, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.03em", color: "#3B445C" };
const printTd = { padding: "8px 10px", verticalAlign: "top" };
