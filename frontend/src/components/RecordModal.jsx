import { useState } from "react";
import { X } from "lucide-react";
import { LEVELS, COUNTRIES, STAGE_ORDER, toInputDate } from "../constants";
import { btnPrimary, btnSecondary } from "./Shared";

export default function RecordModal({ record, visibleCountries, defaultCountry, knownReferrers = [], onSave, onClose, saving }) {
  const [form, setForm] = useState(() =>
    record
      ? {
          ...record,
          date: toInputDate(record.date),
          deferred: toInputDate(record.deferred),
          olRequest: toInputDate(record.olRequest),
          olReceived: toInputDate(record.olReceived),
          withdraw: toInputDate(record.withdraw),
          payment: toInputDate(record.payment),
          visaLodgement: toInputDate(record.visaLodgement),
          visaOutcome: toInputDate(record.visaOutcome),
          refund: toInputDate(record.refund),
        }
      : {
          country: defaultCountry || visibleCountries[0],
          date: new Date().toISOString().slice(0, 10),
          referredBy: "", name: "", level: "UG", course: "", provider: "",
          intake: "", stage: "Initial / Applied", remarks: "",
        }
  );
  const [errors, setErrors] = useState({});

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  }

  function handleSubmit() {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Applicant name is required";
    if (!form.country) errs.country = "Country is required";
    if (!form.course?.trim()) errs.course = "Course is required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave(form);
  }

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: 720 }}>
        <div style={modalHeaderStyle}>
          <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 19, fontWeight: 700, margin: 0 }}>
            {record ? "Edit application" : "Add application"}
          </h2>
          <button onClick={onClose} style={iconCloseStyle}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 26px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxHeight: "62vh", overflowY: "auto" }}>
          <Field label="Applicant name" required error={errors.name} full>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Sandeep Thapa" style={inputStyle(errors.name)} />
          </Field>

          <Field label="Country / Department" required error={errors.country}>
            <select value={form.country} onChange={(e) => update("country", e.target.value)} style={inputStyle(errors.country)}>
              {(visibleCountries.length ? visibleCountries : COUNTRIES).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Level">
            <select value={form.level} onChange={(e) => update("level", e.target.value)} style={inputStyle()}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </Field>

          <Field label="Course / Programme" required error={errors.course} full>
            <input value={form.course} onChange={(e) => update("course", e.target.value)} placeholder="e.g. BSc Computer Science" style={inputStyle(errors.course)} />
          </Field>

          <Field label="Provider / University" full>
            <input value={form.provider} onChange={(e) => update("provider", e.target.value)} placeholder="e.g. Coventry University" style={inputStyle()} />
          </Field>

          <Field label="Date applied">
            <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} style={inputStyle()} />
          </Field>

          <Field label="Intake">
            <input value={form.intake || ""} onChange={(e) => update("intake", e.target.value)} placeholder="e.g. 2026-01-01 or Fall 2026" style={inputStyle()} />
          </Field>

          <Field label="Pipeline stage" full>
            <select value={form.stage} onChange={(e) => update("stage", e.target.value)} style={inputStyle()}>
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #E4DFD4", paddingTop: 14, marginTop: 2 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#7A8299", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 10 }}>
              Stage dates
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="Deferred to">
                <input type="date" value={form.deferred || ""} onChange={(e) => update("deferred", e.target.value)} style={inputStyle()} />
              </Field>
              <Field label="OL requested">
                <input type="date" value={form.olRequest || ""} onChange={(e) => update("olRequest", e.target.value)} style={inputStyle()} />
              </Field>
              <Field label="OL received">
                <input type="date" value={form.olReceived || ""} onChange={(e) => update("olReceived", e.target.value)} style={inputStyle()} />
              </Field>
              <Field label="Withdraw / Cancel">
                <input type="date" value={form.withdraw || ""} onChange={(e) => update("withdraw", e.target.value)} style={inputStyle()} />
              </Field>
              <Field label="Payment date">
                <input type="date" value={form.payment || ""} onChange={(e) => update("payment", e.target.value)} style={inputStyle()} />
              </Field>
              <Field label="Visa lodgement">
                <input type="date" value={form.visaLodgement || ""} onChange={(e) => update("visaLodgement", e.target.value)} style={inputStyle()} />
              </Field>
              <Field label="Visa outcome">
                <input type="date" value={form.visaOutcome || ""} onChange={(e) => update("visaOutcome", e.target.value)} style={inputStyle()} />
              </Field>
              <Field label="Refund">
                <input type="date" value={form.refund || ""} onChange={(e) => update("refund", e.target.value)} style={inputStyle()} />
              </Field>
              <Field label="Other (free text)">
                <input value={form.other || ""} onChange={(e) => update("other", e.target.value)} placeholder="e.g. RE-APPLY" style={inputStyle()} />
              </Field>
            </div>
          </div>

          <Field label="Referred by (agent)">
            <input
              value={form.referredBy || ""}
              onChange={(e) => update("referredBy", e.target.value)}
              placeholder="e.g. Future Dream"
              list="referrer-list"
              style={inputStyle()}
            />
            <datalist id="referrer-list">
              {knownReferrers.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </Field>

          <Field label="Remarks" full>
            <textarea
              value={form.remarks || ""}
              onChange={(e) => update("remarks", e.target.value)}
              rows={2}
              placeholder="Notes, follow-ups, special conditions…"
              style={{ ...inputStyle(), resize: "vertical", fontFamily: "inherit" }}
            />
          </Field>
        </div>

        <div style={modalFooterStyle}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : record ? "Save changes" : "Add application"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, error, full, children }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto", display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: "#3B445C" }}>
        {label} {required && <span style={{ color: "#C44536" }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11.5, color: "#C44536" }}>{error}</span>}
    </div>
  );
}

function inputStyle(hasError) {
  return { width: "100%", padding: "9px 11px", borderRadius: 7, border: `1px solid ${hasError ? "#C44536" : "#E4DFD4"}`, fontSize: 13.5, background: "#fff" };
}

export const overlayStyle = { position: "fixed", inset: 0, background: "rgba(27,42,74,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 };
export const modalStyle = { background: "#FAF8F3", borderRadius: 14, width: "100%", boxShadow: "0 30px 70px rgba(0,0,0,0.3)" };
const modalHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 26px", borderBottom: "1px solid #E4DFD4" };
const modalFooterStyle = { display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 26px", borderTop: "1px solid #E4DFD4" };
const iconCloseStyle = { background: "none", border: "none", color: "#9AA4BD", display: "flex" };
