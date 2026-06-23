import { useEffect, useState } from "react";
import { Settings, Plus, X, Trash2 } from "lucide-react";
import { UsersAPI, ApplicationsAPI, CountriesAPI } from "../api/endpoints";
import { COUNTRY_FLAG } from "../constants";
import { PageHeader, Th, Td, IconBtn, btnPrimary, btnSecondary } from "../components/Shared";
import { overlayStyle, modalStyle } from "../components/RecordModal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function TeamPage() {
  const [staff, setStaff] = useState([]);
  const [countryCounts, setCountryCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | user
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toast, setToast] = useState(null);

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  async function load() {
    setLoading(true);
    try {
      const [{ users }, { byCountry }] = await Promise.all([UsersAPI.list(), ApplicationsAPI.dashboardStats()]);
      setStaff(users);
      const m = {};
      for (const row of byCountry) m[row._id] = row.count;
      setCountryCounts(m);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't load team data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(form) {
    try {
      if (form._id) {
        const { password, ...rest } = form;
        const payload = password ? form : rest;
        await UsersAPI.update(form._id, payload);
        notify("Staff member updated");
      } else {
        await UsersAPI.create(form);
        notify("Staff member added");
      }
      setEditing(null);
      load();
    } catch (err) {
      notify(err.response?.data?.error || "Couldn't save staff member.");
    }
  }

  async function handleDelete() {
    try {
      await UsersAPI.remove(confirmDeleteId);
      notify("Staff member removed");
      setConfirmDeleteId(null);
      load();
    } catch (err) {
      notify(err.response?.data?.error || "Couldn't remove staff member.");
    }
  }

  if (loading) return <p style={{ color: "#7A8299" }}>Loading team…</p>;

  return (
    <div>
      <PageHeader
        title="Team & access"
        subtitle="Each staff member only sees applications for the countries assigned to them."
        right={
          <button onClick={() => setEditing("new")} style={btnPrimary}>
            <Plus size={16} /> Add staff
          </button>
        }
      />
      {error && <p style={{ color: "#C44536" }}>{error}</p>}

      <div style={{ background: "#fff", border: "1px solid #E4DFD4", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "#FAF8F3", borderBottom: "1px solid #E4DFD4" }}>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Assigned countries</Th>
              <Th width={90}></Th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s._id} style={{ borderBottom: "1px solid #F1EDE3" }}>
                <Td><span style={{ fontWeight: 600 }}>{s.name}</span></Td>
                <Td style={{ color: "#5B6478" }}>{s.email}</Td>
                <Td>
                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: s.role === "admin" ? "#1B2A4A" : "#EFF1F5", color: s.role === "admin" ? "#E0922F" : "#5B6478" }}>
                    {s.role === "admin" ? "Admin" : "Staff"}
                  </span>
                </Td>
                <Td>
                  {s.role === "admin" ? (
                    <span style={{ color: "#9AA4BD", fontStyle: "italic" }}>All countries</span>
                  ) : (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {(s.countries || []).map((c) => (
                        <span key={c} style={{ fontSize: 11.5, padding: "3px 8px", borderRadius: 6, background: "#EFF1F5", color: "#3B445C", fontWeight: 600 }}>
                          {COUNTRY_FLAG[c]} {c} · {countryCounts[c] || 0}
                        </span>
                      ))}
                      {(!s.countries || s.countries.length === 0) && <span style={{ color: "#C44536", fontSize: 12 }}>No countries assigned</span>}
                    </div>
                  )}
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <IconBtn title="Edit access" onClick={() => setEditing(s)}><Settings size={14} /></IconBtn>
                    <IconBtn title="Remove" danger onClick={() => setConfirmDeleteId(s._id)}><Trash2 size={14} /></IconBtn>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <StaffModal user={editing === "new" ? null : editing} onSave={handleSave} onClose={() => setEditing(null)} />
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Remove this staff member? They'll lose access immediately. Applications they created or edited are kept."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={handleDelete}
        />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#1B2A4A", color: "#FAF8F3", padding: "12px 22px", borderRadius: 8, fontSize: 14, fontWeight: 500, boxShadow: "0 8px 24px rgba(27,42,74,0.25)", zIndex: 200 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function StaffModal({ user, onSave, onClose }) {
  const [form, setForm] = useState(() =>
    user
      ? { _id: user._id, name: user.name, email: user.email, role: user.role, countries: user.countries || [], password: "" }
      : { name: "", email: "", role: "staff", countries: [], password: "" }
  );
  const [errors, setErrors] = useState({});
  const [availableCountries, setAvailableCountries] = useState([]);

  useEffect(() => {
    CountriesAPI.list().then(({ countries }) => setAvailableCountries(countries.filter((c) => c.active)));
  }, []);

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  }

  function toggleCountry(c) {
    setForm((f) => {
      const has = f.countries.includes(c);
      return { ...f, countries: has ? f.countries.filter((x) => x !== c) : [...f.countries, c] };
    });
  }

  function handleSubmit() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    if (!user && !form.password.trim()) errs.password = "Password is required for a new staff member";
    if (form.role === "staff" && form.countries.length === 0) errs.countries = "Assign at least one country";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave(form);
  }

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 26px", borderBottom: "1px solid #E4DFD4" }}>
          <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 19, fontWeight: 700, margin: 0 }}>
            {user ? "Edit staff member" : "Add staff member"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#9AA4BD", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 26px", display: "flex", flexDirection: "column", gap: 14, maxHeight: "60vh", overflowY: "auto" }}>
          <FormField label="Name" error={errors.name}>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} style={inputStyle(errors.name)} />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} disabled={!!user} style={inputStyle(errors.email)} />
          </FormField>
          <FormField label={user ? "New password (leave blank to keep current)" : "Password"} error={errors.password}>
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} style={inputStyle(errors.password)} />
          </FormField>
          <FormField label="Role">
            <select value={form.role} onChange={(e) => update("role", e.target.value)} style={inputStyle()}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>
          {form.role === "staff" && (
            <FormField label="Assigned countries" error={errors.countries}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {availableCountries.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => toggleCountry(c.name)}
                    style={{
                      padding: "5px 10px", borderRadius: 16, fontSize: 12.5, fontWeight: 600,
                      border: form.countries.includes(c.name) ? "1px solid #1B2A4A" : "1px solid #E4DFD4",
                      background: form.countries.includes(c.name) ? "#1B2A4A" : "#fff",
                      color: form.countries.includes(c.name) ? "#FAF8F3" : "#5B6478",
                    }}
                  >
                    {c.flagEmoji} {c.name}
                  </button>
                ))}
              </div>
            </FormField>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 26px", borderTop: "1px solid #E4DFD4" }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} style={btnPrimary}>{user ? "Save changes" : "Add staff member"}</button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: "#3B445C" }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 11.5, color: "#C44536" }}>{error}</span>}
    </div>
  );
}

function inputStyle(hasError) {
  return { width: "100%", padding: "9px 11px", borderRadius: 7, border: `1px solid ${hasError ? "#C44536" : "#E4DFD4"}`, fontSize: 13.5, background: "#fff" };
}
