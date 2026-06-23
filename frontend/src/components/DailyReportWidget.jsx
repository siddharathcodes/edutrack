import { useEffect, useState } from "react";
import { ClipboardList, X, Plus, Check, Trash2, Sparkles } from "lucide-react";
import { DailyReportsAPI } from "../api/endpoints";
import { fmtDate } from "../constants";

export default function DailyReportWidget() {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [text, setText] = useState("");
  const [newTodo, setNewTodo] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { report } = await DailyReportsAPI.getToday();
      setReport(report);
      setText(report.text || "");
    } catch (err) {
      // quiet failure — the widget just won't open with data if this fails
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && !report) load();
  }, [open]);

  async function handleSaveText() {
    setSaving(true);
    try {
      const { report: updated } = await DailyReportsAPI.updateToday(text);
      setReport(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTodo() {
    if (!newTodo.trim()) return;
    const { report: updated } = await DailyReportsAPI.addTodo(newTodo.trim());
    setReport(updated);
    setNewTodo("");
  }

  async function handleToggleTodo(id) {
    const { report: updated } = await DailyReportsAPI.toggleTodo(id);
    setReport(updated);
  }

  async function handleDeleteTodo(id) {
    const { report: updated } = await DailyReportsAPI.deleteTodo(id);
    setReport(updated);
  }

  const todayLabel = fmtDate(new Date());
  const doneCount = report?.todos?.filter((t) => t.done).length || 0;
  const totalCount = report?.todos?.length || 0;

  return (
    <div style={{ position: "fixed", bottom: 22, right: 22, zIndex: 150 }}>
      {open && (
        <div style={{ width: 340, maxHeight: 480, background: "#fff", border: "1px solid #E4DFD4", borderRadius: 14, boxShadow: "0 20px 50px rgba(27,42,74,0.25)", marginBottom: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ background: "#1B2A4A", color: "#FAF8F3", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>Today's report</div>
              <div style={{ fontSize: 11, color: "#9AA4BD" }}>{todayLabel}</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#9AA4BD", display: "flex" }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: 14, overflowY: "auto", flex: 1 }}>
            {loading ? (
              <p style={{ fontSize: 13, color: "#9AA4BD" }}>Loading…</p>
            ) : (
              <>
                {report?.autoStats && (report.autoStats.applicationsAdded > 0 || report.autoStats.applicationsUpdated > 0) && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, fontSize: 11.5 }}>
                    <span style={{ background: "#EFF1F5", padding: "4px 9px", borderRadius: 6, fontWeight: 600, color: "#3B445C" }}>
                      +{report.autoStats.applicationsAdded} added
                    </span>
                    <span style={{ background: "#EFF1F5", padding: "4px 9px", borderRadius: 6, fontWeight: 600, color: "#3B445C" }}>
                      {report.autoStats.applicationsUpdated} updated
                    </span>
                  </div>
                )}

                <label style={{ fontSize: 11.5, fontWeight: 700, color: "#7A8299", textTransform: "uppercase", letterSpacing: "0.03em" }}>What I did today</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onBlur={handleSaveText}
                  rows={4}
                  placeholder="Quick notes on today's work…"
                  style={{ width: "100%", marginTop: 6, padding: "8px 10px", borderRadius: 8, border: "1px solid #E4DFD4", fontSize: 13, fontFamily: "inherit", resize: "vertical" }}
                />
                <div style={{ fontSize: 10.5, color: "#9AA4BD", marginTop: 4 }}>{saving ? "Saving…" : "Saves automatically when you click away"}</div>

                <div style={{ marginTop: 16, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: "#7A8299", textTransform: "uppercase", letterSpacing: "0.03em" }}>To-do</label>
                  {totalCount > 0 && <span style={{ fontSize: 11, color: "#9AA4BD" }}>{doneCount}/{totalCount} done</span>}
                </div>

                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <input
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                    placeholder="Add a task…"
                    style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: "1px solid #E4DFD4", fontSize: 12.5 }}
                  />
                  <button onClick={handleAddTodo} style={{ width: 32, height: 32, borderRadius: 7, border: "none", background: "#E0922F", color: "#1B2A4A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Plus size={15} />
                  </button>
                </div>

                {(report?.todos || []).map((t) => (
                  <div key={t._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 2px" }}>
                    <button onClick={() => handleToggleTodo(t._id)} style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${t.done ? "#2F8F5B" : "#C7CCDA"}`, background: t.done ? "#2F8F5B" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {t.done && <Check size={11} color="#fff" />}
                    </button>
                    <span style={{ flex: 1, fontSize: 12.5, color: t.done ? "#9AA4BD" : "#3B445C", textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                    <button onClick={() => handleDeleteTodo(t._id)} style={{ background: "none", border: "none", color: "#C7CCDA", display: "flex", flexShrink: 0 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {totalCount === 0 && <p style={{ fontSize: 12, color: "#C7CCDA", margin: "4px 0" }}>No tasks yet.</p>}
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 52, height: 52, borderRadius: "50%", border: "none", background: "#E0922F", color: "#1B2A4A",
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(224,146,47,0.45)",
          marginLeft: "auto",
        }}
        title="Daily report & to-do"
      >
        <ClipboardList size={22} />
      </button>
    </div>
  );
}
