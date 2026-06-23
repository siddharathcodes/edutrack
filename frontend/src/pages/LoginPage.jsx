import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Globe2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate(location.state?.from?.pathname || "/", { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't log in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#1B2A4A", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: "#E0922F", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe2 size={20} color="#1B2A4A" strokeWidth={2.3} />
            </div>
            <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 25, fontWeight: 700, color: "#FAF8F3" }}>EduTrack</span>
          </div>
          <p style={{ color: "#9AA4BD", fontSize: 14.5, margin: 0 }}>UniConsultants Alliance — Application Tracker</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "#FAF8F3", borderRadius: 14, padding: 28, boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#3B445C", marginBottom: 6 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            placeholder="you@uca.edu.np"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E4DFD4", fontSize: 14, marginBottom: 16 }}
          />

          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#3B445C", marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E4DFD4", fontSize: 14, marginBottom: 8 }}
          />

          {error && <p style={{ color: "#C44536", fontSize: 13, margin: "8px 0 0" }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 18, width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
              background: submitting ? "#E4DFD4" : "#E0922F", color: submitting ? "#9AA4BD" : "#1B2A4A",
              fontWeight: 700, fontSize: 15,
            }}
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
