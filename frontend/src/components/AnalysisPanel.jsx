import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { AnalysisAPI } from "../api/endpoints";
import { Panel } from "./Shared";

export default function AnalysisPanel({ country, dateFrom, dateTo }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (country && country !== "All") params.country = country;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const { analysis } = await AnalysisAPI.generate(params);
      setAnalysis(analysis);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't generate the analysis right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: analysis || error ? 14 : 0 }}>
        <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color="#E0922F" /> AI analysis
        </h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 7, border: "1px solid #E4DFD4", background: "#fff", fontSize: 12.5, fontWeight: 600, color: "#3B445C", opacity: loading ? 0.6 : 1 }}
        >
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          {loading ? "Analyzing…" : analysis ? "Regenerate" : "Analyze this view"}
        </button>
      </div>

      {!analysis && !error && !loading && (
        <p style={{ fontSize: 13, color: "#9AA4BD", margin: 0 }}>
          Generates a short strengths/weaknesses summary of whatever country and date range you've selected above.
        </p>
      )}

      {error && <p style={{ fontSize: 13, color: "#C44536", margin: 0 }}>{error}</p>}

      {analysis && (
        <div style={{ fontSize: 14, lineHeight: 1.65, color: "#3B445C", whiteSpace: "pre-line" }}>{analysis}</div>
      )}

      <style>{"@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"}</style>
    </Panel>
  );
}
