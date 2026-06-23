import { useEffect, useState } from "react";
import { Plus, X, Trash2, Send, History, ChevronDown, ChevronRight } from "lucide-react";
import { CountriesAPI, NotificationsAPI, DailyReportsAPI, UsersAPI } from "../api/endpoints";
import { PageHeader, Panel, Th, Td, IconBtn, btnPrimary, btnSecondary } from "../components/Shared";
import { fmtDate } from "../constants";

export default function AdminToolsPage() {
  const [tab, setTab] = useState("countries");

  return (
    <div>
      <PageHeader title="Admin tools" subtitle="Manage countries, send notices, and review staff daily reports." />

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <TabBtn label="Countries" active={tab === "countries"} onClick={() => setTab("countries")} />
        <TabBtn label="Send notice" active={tab === "notice"} onClick={() => setTab("notice")} />
        <TabBtn label="Daily reports" active={tab === "reports"} onClick={() => setTab("reports")} />
      </div>

      {tab === "countries" && <CountriesTab />}
      {tab === "notice" && <NoticeTab />}
      {tab === "reports" && <ReportsTab />}
    </div>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px", borderRadius: 8, border: active ? "1px solid #1B2A4A" : "1px solid #E4DFD4",
        background: active ? "#1B2A4A" : "#fff", color: active ? "#FAF8F3" : "#5B6478", fontSize: 13.5, fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}

// ---------------- Countries ----------------

function CountriesTab() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFlag, setNewFlag] = useState("🌐");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { countries } = await CountriesAPI.list();
      setCountries(countries);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't load countries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!newName.trim()) return;
    try {
      await CountriesAPI.create({ name: newName.trim(), flagEmoji: newFlag.trim() || "🌐" });
      setNewName("");
      setNewFlag("🌐");
      setAdding(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't add country.");
    }
  }

  async function handleToggleActive(c) {
    await CountriesAPI.update(c._id, { active: !c.active });
    load();
  }

  async function handleRemove(c) {
    try {
      await CountriesAPI.remove(c._id);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't remove country.");
    }
  }

  return (
    <Panel>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontSize: 13, color: "#7A8299", margin: 0 }}>
          Adding a country here makes it available everywhere — staff assignment, application forms, and filters — automatically.
        </p>
        <button onClick={() => setAdding((v) => !v)} style={btnPrimary}>
          <Plus size={15} /> Add country
        </button>
      </div>

      {error && <p style={{ color: "#C44536", fontSize: 13 }}>{error}</p>}

      {adding && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14, padding: 12, background: "#FAF8F3", borderRadius: 8 }}>
          <input value={newFlag} onChange={(e) => setNewFlag(e.target.value)} placeholder="🌐" style={{ width: 56, padding: "8px 10px", borderRadius: 7, border: "1px solid #E4DFD4", textAlign: "center" }} />
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Country name, e.g. Italy" style={{ flex: 1, padding: "8px 10px", borderRadius: 7, border: "1px solid #E4DFD4", fontSize: 13.5 }} />
          <button onClick={handleAdd} style={btnPrimary}>Add</button>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#9AA4BD", fontSize: 13 }}>Loading…</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E4DFD4" }}>
              <Th>Country</Th>
              <Th>Status</Th>
              <Th width={100}></Th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => (
              <tr key={c._id} style={{ borderBottom: "1px solid #F1EDE3" }}>
                <Td>{c.flagEmoji} {c.name}</Td>
                <Td>
                  <button
                    onClick={() => handleToggleActive(c)}
                    style={{
                      fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 20, border: "none",
                      background: c.active ? "#E7F3EC" : "#EFF1F5", color: c.active ? "#2F8F5B" : "#9AA4BD",
                    }}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </button>
                </Td>
                <Td>
                  <IconBtn title="Remove" danger onClick={() => handleRemove(c)}><Trash2 size={14} /></IconBtn>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

// ---------------- Send notice ----------------

function NoticeTab() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info");
  const [scope, setScope] = useState("all"); // all | country | staff
  const [country, setCountry] = useState("");
  const [staffId, setStaffId] = useState("");
  const [staff, setStaff] = useState([]);
  const [countries, setCountries] = useState([]);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    UsersAPI.list().then(({ users }) => setStaff(users.filter((u) => u.role === "staff")));
    CountriesAPI.list().then(({ countries }) => setCountries(countries));
  }, []);

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }
    setError("");
    try {
      const payload = { title, message, severity };
      if (scope === "country") payload.country = country;
      if (scope === "staff") payload.recipients = [staffId];
      await NotificationsAPI.create(payload);
      setSent(true);
      setTitle("");
      setMessage("");
      setTimeout(() => setSent(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't send notice.");
    }
  }

  return (
    <Panel>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 }}>
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Office closed Friday" style={inputStyle} />
        </Field>
        <Field label="Message">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Details…" style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
        </Field>
        <Field label="Severity">
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={inputStyle}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="urgent">Urgent</option>
          </select>
        </Field>
        <Field label="Send to">
          <select value={scope} onChange={(e) => setScope(e.target.value)} style={inputStyle}>
            <option value="all">Everyone</option>
            <option value="country">A specific country / department</option>
            <option value="staff">A specific staff member</option>
          </select>
        </Field>
        {scope === "country" && (
          <Field label="Country">
            <select value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle}>
              <option value="">Choose a country…</option>
              {countries.map((c) => <option key={c._id} value={c.name}>{c.flagEmoji} {c.name}</option>)}
            </select>
          </Field>
        )}
        {scope === "staff" && (
          <Field label="Staff member">
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={inputStyle}>
              <option value="">Choose a staff member…</option>
              {staff.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
            </select>
          </Field>
        )}

        {error && <p style={{ color: "#C44536", fontSize: 13, margin: 0 }}>{error}</p>}
        {sent && <p style={{ color: "#2F8F5B", fontSize: 13, margin: 0 }}>Notice sent.</p>}

        <button onClick={handleSend} style={{ ...btnPrimary, alignSelf: "flex-start" }}>
          <Send size={14} /> Send notice
        </button>
      </div>
    </Panel>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: "#3B445C" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: 7, border: "1px solid #E4DFD4", fontSize: 13.5, background: "#fff" };

// ---------------- Daily reports (admin view, with history) ----------------

function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    DailyReportsAPI.adminList()
      .then(({ reports }) => setReports(reports))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Panel><p style={{ color: "#9AA4BD", fontSize: 13 }}>Loading…</p></Panel>;

  return (
    <Panel>
      <p style={{ fontSize: 13, color: "#7A8299", marginTop: 0 }}>
        Only Admin can see edit history. Staff only see their current report — earlier versions are kept, never erased.
      </p>
      {reports.length === 0 && <p style={{ color: "#9AA4BD", fontSize: 13 }}>No daily reports yet.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reports.map((r) => (
          <div key={r._id} style={{ border: "1px solid #E4DFD4", borderRadius: 10, overflow: "hidden" }}>
            <button
              onClick={() => setExpandedId(expandedId === r._id ? null : r._id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#FAF8F3", border: "none", textAlign: "left" }}
            >
              {expandedId === r._id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.staff?.name || "Unknown"}</span>
              <span style={{ fontSize: 12.5, color: "#9AA4BD" }}>{r.date}</span>
              <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#9AA4BD" }}>
                {r.todos?.filter((t) => t.done).length || 0}/{r.todos?.length || 0} todos done
                {r.revisions?.length > 0 && (
                  <span style={{ marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <History size={11} /> {r.revisions.length} edit{r.revisions.length !== 1 ? "s" : ""}
                  </span>
                )}
              </span>
            </button>
            {expandedId === r._id && (
              <div style={{ padding: "14px 16px", borderTop: "1px solid #E4DFD4" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#7A8299", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>Current report</div>
                <p style={{ fontSize: 13.5, color: "#3B445C", whiteSpace: "pre-line", marginTop: 0 }}>{r.text || "(empty)"}</p>

                {r.todos?.length > 0 && (
                  <>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#7A8299", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6, marginTop: 12 }}>To-do</div>
                    {r.todos.map((t) => (
                      <div key={t._id} style={{ fontSize: 13, color: t.done ? "#9AA4BD" : "#3B445C", textDecoration: t.done ? "line-through" : "none" }}>
                        • {t.text}
                      </div>
                    ))}
                  </>
                )}

                {r.revisions?.length > 0 && (
                  <>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#7A8299", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6, marginTop: 12 }}>
                      Edit history ({r.revisions.length})
                    </div>
                    {r.revisions.map((rev, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: "#9AA4BD", padding: "6px 0", borderTop: i > 0 ? "1px solid #F1EDE3" : "none" }}>
                        <div style={{ fontSize: 11, marginBottom: 2 }}>{fmtDate(rev.editedAt)}</div>
                        <div style={{ whiteSpace: "pre-line" }}>{rev.text}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
