import { useEffect, useRef, useState } from "react";
import { Bell, X, Check, AlertTriangle, Info, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NotificationsAPI } from "../api/endpoints";
import { fmtDate } from "../constants";

const SEVERITY_ICON = { info: Info, warning: AlertTriangle, urgent: AlertTriangle };
const SEVERITY_COLOR = { info: "#2C6E9E", warning: "#C98A1F", urgent: "#C44536" };

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  async function load() {
    try {
      const { notifications, unreadCount } = await NotificationsAPI.list();
      setNotifications(notifications);
      setUnreadCount(unreadCount);
    } catch (err) {
      // Fail quietly in the bell — not critical to block the rest of the app on this.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // poll every minute for new notices
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkAllRead() {
    await NotificationsAPI.markAllRead();
    load();
  }

  async function handleMarkRead(id) {
    await NotificationsAPI.markRead(id);
    load();
  }

  async function handleDelete(id) {
    await NotificationsAPI.remove(id);
    load();
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ position: "relative", width: 36, height: 36, borderRadius: 9, border: "1px solid #E4DFD4", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B445C" }}
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: "#C44536", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "115%", right: 0, width: 360, maxHeight: 440, background: "#fff", border: "1px solid #E4DFD4", borderRadius: 12, boxShadow: "0 16px 40px rgba(27,42,74,0.18)", zIndex: 100, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #E4DFD4" }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ fontSize: 12, color: "#2C6E9E", background: "none", border: "none", fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading && <p style={{ padding: 16, fontSize: 13, color: "#9AA4BD" }}>Loading…</p>}
            {!loading && notifications.length === 0 && <p style={{ padding: 16, fontSize: 13, color: "#9AA4BD" }}>No notifications yet.</p>}
            {notifications.map((n) => {
              const Icon = SEVERITY_ICON[n.severity] || Info;
              const isRead = n.readBy?.some((id) => id === user._id || id?._id === user._id);
              return (
                <div key={n._id} style={{ display: "flex", gap: 10, padding: "12px 16px", borderBottom: "1px solid #F1EDE3", background: isRead ? "#fff" : "#FFF8EE" }}>
                  <Icon size={16} color={SEVERITY_COLOR[n.severity] || "#2C6E9E"} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1B2A4A" }}>{n.title}</div>
                    <div style={{ fontSize: 12.5, color: "#5B6478", marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: "#9AA4BD", marginTop: 4 }}>
                      {n.sentBy?.name ? `${n.sentBy.name} · ` : n.type === "auto" ? "Automatic alert · " : ""}
                      {fmtDate(n.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                    {!isRead && (
                      <button onClick={() => handleMarkRead(n._id)} title="Mark read" style={{ background: "none", border: "none", color: "#9AA4BD", display: "flex" }}>
                        <Check size={14} />
                      </button>
                    )}
                    {user.role === "admin" && (
                      <button onClick={() => handleDelete(n._id)} title="Delete" style={{ background: "none", border: "none", color: "#C44536", display: "flex" }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
