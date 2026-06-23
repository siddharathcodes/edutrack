import { AlertTriangle } from "lucide-react";
import { overlayStyle, modalStyle } from "./RecordModal";
import { btnPrimary, btnSecondary } from "./Shared";

export default function ConfirmDialog({ message, onCancel, onConfirm, confirming }) {
  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: 380, padding: 26 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: "#FBEAE7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={18} color="#C44536" />
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: "#3B445C", margin: 0 }}>{message}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onCancel} style={btnSecondary}>Cancel</button>
          <button onClick={onConfirm} disabled={confirming} style={{ ...btnPrimary, background: "#C44536", color: "#fff", opacity: confirming ? 0.6 : 1 }}>
            {confirming ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
