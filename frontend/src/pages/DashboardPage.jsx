import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApplicationsAPI } from "../api/endpoints";
import { PageHeader, Panel, StatCard } from "../components/Shared";
import { STAGE_ORDER, STAGE_COLOR, fmtDate } from "../constants";
import { useCountries } from "../hooks/useCountries";
import AnalysisPanel from "../components/AnalysisPanel";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeNames, flagFor } = useCountries();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [country, setCountry] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const visibleCountries = user.role === "admin" ? activeNames : user.countries || [];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = {};
        if (country !== "All") params.country = country;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const [statsRes, recentRes] = await Promise.all([
          ApplicationsAPI.dashboardStats(params),
          ApplicationsAPI.list({ ...params, sortBy: "date", sortDir: "desc", limit: 6 }),
        ]);
        if (cancelled) return;
        setStats(statsRes);
        setRecent(recentRes.rows);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || "Couldn't load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [country, dateFrom, dateTo]);

  if (loading) return <p style={{ color: "#7A8299" }}>Loading dashboard…</p>;
  if (error) return <p style={{ color: "#C44536" }}>{error}</p>;

  const byStageMap = {};
  for (const row of stats.byStage) byStageMap[row._id] = row.count;

  const byCountryMap = {};
  for (const row of stats.byCountry) byCountryMap[row._id] = row.count;

  const inProgress = ["Initial / Applied", "OL Requested", "OL Received", "Payment Done", "Visa Lodged", "Visa Outcome"]
    .reduce((sum, s) => sum + (byStageMap[s] || 0), 0);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        subtitle={user.role === "admin" ? "Here's how every department is tracking this intake season." : "Here's what's moving in your department."}
        right={
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {visibleCountries.length > 1 && (
              <select value={country} onChange={(e) => setCountry(e.target.value)} style={dashFilterStyle}>
                <option value="All">All countries</option>
                {visibleCountries.map((c) => (
                  <option key={c} value={c}>{flagFor(c)} {c}</option>
                ))}
              </select>
            )}
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={dashFilterStyle} title="From date" />
            <span style={{ color: "#9AA4BD", fontSize: 13 }}>to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={dashFilterStyle} title="To date" />
            {(dateFrom || dateTo || country !== "All") && (
              <button onClick={() => { setCountry("All"); setDateFrom(""); setDateTo(""); }} style={{ fontSize: 12.5, color: "#C44536", background: "none", border: "none", fontWeight: 600 }}>
                Clear
              </button>
            )}
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard label="Total applications" value={stats.total} color="#1B2A4A" />
        <StatCard label="In progress" value={inProgress} color="#2C6E9E" />
        <StatCard label="Visa lodged" value={byStageMap["Visa Lodged"] || 0} color="#C98A1F" />
        <StatCard label="Outcome received" value={byStageMap["Visa Outcome"] || 0} color="#2F8F5B" />
        <StatCard label="Refunds" value={byStageMap["Refund"] || 0} color="#C44536" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        <Panel title="Pipeline by stage">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {STAGE_ORDER.filter((s) => byStageMap[s] > 0).map((stage) => (
              <div key={stage} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 140, fontSize: 13, fontWeight: 600, color: "#3B445C", flexShrink: 0 }}>{stage}</span>
                <div style={{ flex: 1, height: 10, background: "#EFEAE0", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.max(4, (byStageMap[stage] / stats.total) * 100)}%`, background: STAGE_COLOR[stage], borderRadius: 6 }} />
                </div>
                <span style={{ width: 30, fontSize: 13, fontWeight: 700, textAlign: "right", color: "#1B2A4A" }}>{byStageMap[stage]}</span>
              </div>
            ))}
            {stats.total === 0 && <p style={{ color: "#9AA4BD", fontSize: 13 }}>No applications yet.</p>}
          </div>
        </Panel>

        <Panel title="Recent activity">
          <div>
            {recent.map((r, i) => (
              <div key={r._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i > 0 ? "1px solid #EFEAE0" : "none" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: STAGE_COLOR[r.stage], flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "#7A8299" }}>{r.country} · {r.stage}</div>
                </div>
                <span style={{ fontSize: 11.5, color: "#9AA4BD", flexShrink: 0 }}>{fmtDate(r.date)}</span>
              </div>
            ))}
            {recent.length === 0 && <p style={{ color: "#9AA4BD", fontSize: 13 }}>No activity yet.</p>}
          </div>
        </Panel>
      </div>

      {user.role === "admin" && (
        <Panel title="By department" style={{ marginTop: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {Object.entries(byCountryMap).sort((a, b) => b[1] - a[1]).map(([countryName, count]) => (
              <button
                key={countryName}
                onClick={() => navigate(`/applications?country=${encodeURIComponent(countryName)}`)}
                style={{ textAlign: "left", border: "1px solid #E4DFD4", borderRadius: 10, padding: 14, background: "#fff" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                  <span>{flagFor(countryName)}</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{countryName}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Source Serif 4', serif", color: "#1B2A4A" }}>{count}</div>
                <div style={{ fontSize: 11.5, color: "#7A8299" }}>applications</div>
              </button>
            ))}
          </div>
        </Panel>
      )}

      <AnalysisPanel country={country} dateFrom={dateFrom} dateTo={dateTo} />
    </div>
  );
}

const dashFilterStyle = { padding: "7px 10px", borderRadius: 7, border: "1px solid #E4DFD4", fontSize: 13, background: "#fff" };
