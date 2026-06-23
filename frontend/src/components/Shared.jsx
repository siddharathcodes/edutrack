import { ACTIVE_STAGES, STAGE_COLOR } from "../constants";

export function PageHeader({ title, subtitle, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 27, fontWeight: 700, margin: 0, color: "#1B2A4A" }}>{title}</h1>
        {subtitle && <p style={{ color: "#7A8299", fontSize: 14, margin: "5px 0 0" }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Panel({ title, children, style }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E4DFD4", borderRadius: 12, padding: 20, ...style }}>
      {title && <h3 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>{title}</h3>}
      {children}
    </div>
  );
}

export function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E4DFD4", borderRadius: 12, padding: "16px 16px", borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Source Serif 4', serif", color: "#1B2A4A", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: "#7A8299", marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export function StageTracker({ stage }) {
  if (stage === "Refund" || stage === "Deferred" || stage === "Withdrawn/Cancelled") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: `${STAGE_COLOR[stage]}1A`, color: STAGE_COLOR[stage], fontSize: 12, fontWeight: 700 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: STAGE_COLOR[stage] }} />
        {stage}
      </span>
    );
  }
  const idx = ACTIVE_STAGES.indexOf(stage);
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {ACTIVE_STAGES.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center" }} title={s}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: i <= idx ? STAGE_COLOR[stage] : "#E4DFD4", flexShrink: 0 }} />
          {i < ACTIVE_STAGES.length - 1 && <div style={{ width: 16, height: 2, background: i < idx ? STAGE_COLOR[stage] : "#E4DFD4" }} />}
        </div>
      ))}
      <span style={{ marginLeft: 8, fontSize: 11.5, fontWeight: 700, color: STAGE_COLOR[stage], whiteSpace: "nowrap" }}>{stage}</span>
    </div>
  );
}

export function LevelPill({ level }) {
  return <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#EFF1F5", color: "#3B445C" }}>{level || "—"}</span>;
}

export function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 20, border: active ? "1px solid #1B2A4A" : "1px solid #E4DFD4",
      background: active ? "#1B2A4A" : "#fff", color: active ? "#FAF8F3" : "#5B6478", fontSize: 12.5, fontWeight: 600,
    }}>
      {label}
    </button>
  );
}

export function IconBtn({ children, onClick, title, danger }) {
  return (
    <button onClick={onClick} title={title} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E4DFD4", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: danger ? "#C44536" : "#5B6478" }}>
      {children}
    </button>
  );
}

export const btnPrimary = { display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, border: "none", background: "#E0922F", color: "#1B2A4A", fontSize: 13.5, fontWeight: 700 };
export const btnSecondary = { display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 8, border: "1px solid #E4DFD4", background: "#fff", color: "#3B445C", fontSize: 13.5, fontWeight: 600 };

export function Th({ children, width }) {
  return <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11.5, fontWeight: 700, color: "#7A8299", textTransform: "uppercase", letterSpacing: "0.03em", width }}>{children}</th>;
}
export function Td({ children, style, colSpan }) {
  return <td colSpan={colSpan} style={{ padding: "10px 14px", verticalAlign: "top", ...style }}>{children}</td>;
}
