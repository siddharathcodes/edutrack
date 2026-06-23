import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogOut, Users, Globe2, LayoutDashboard, FileText, Building2, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApplicationsAPI } from "../api/endpoints";
import { useCountries } from "../hooks/useCountries";
import NotificationBell from "./NotificationBell";
import DailyReportWidget from "./DailyReportWidget";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [countryCounts, setCountryCounts] = useState({});
  const { activeNames, flagFor } = useCountries();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const visibleCountries = user.role === "admin" ? activeNames : user.countries || [];

  useEffect(() => {
    ApplicationsAPI.dashboardStats()
      .then(({ byCountry }) => {
        const m = {};
        for (const row of byCountry) m[row._id] = row.count;
        setCountryCounts(m);
      })
      .catch(() => { });
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const totalCount = Object.values(countryCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 248, flexShrink: 0, background: "#1B2A4A", color: "#FAF8F3", padding: "26px 18px", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, overflow: "hidden", width: sidebarOpen ? 280 : 90, transition: "all 0.3s ease", }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 8px",
            marginBottom: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#E0922F", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe2 size={17} color="#1B2A4A" strokeWidth={2.3} />
            </div>

           {sidebarOpen && (
  <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 19, fontWeight: 700 }}>
    EduTrack
  </span>
)}
          </div>

          <button
           onClick={() => setSidebarOpen(prev => !prev)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 22 }}>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" end sidebarOpen={sidebarOpen} />
          <NavItem to="/applications" icon={FileText} label="Applications" sidebarOpen={sidebarOpen} />
          {user.role === "admin" && <NavItem to="/team" icon={Users} label="Team & Access" sidebarOpen={sidebarOpen} />}
          {user.role === "admin" && <NavItem to="/admin-tools" icon={Settings} label="Admin tools" sidebarOpen={sidebarOpen} />}
        </nav>

        <div style={{ fontSize: 10, fontWeight: 700, color: "#7E89A3", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 10px", marginBottom: 10 }}>
          {user.role === "admin" ? "All departments" : "Your department"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, overflowY: "auto", flex: 1, scrollbarWidth: "none", msOverflowStyle: "none", }}>
          <CountrySidebarLink
            to="/applications"
            icon={Building2}
            label="All countries"
            count={totalCount}
            sidebarOpen={sidebarOpen}
          />
          {visibleCountries.map((c) => (
            <CountrySidebarLink
              key={c}
              to={`/applications?country=${encodeURIComponent(c)}`}
              flag={flagFor(c)}
              label={c}
              count={countryCounts[c] || 0}
              sidebarOpen={sidebarOpen}
            />
          ))}
        </div>

        <div style={{ borderTop: "1px solid #2E3F63", marginTop: 14, paddingTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#2E3F63", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>
              {user.name.split(" ").map((p) => p[0]).join("")}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ fontSize: 11.5, color: "#8C96AE" }}>{user.role === "admin" ? "Administrator" : "Staff"}</div>
            </div>
          </div>
          <button  onClick={handleLogout}
  style={{
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "6px 10px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "#9AA4BD",
    fontSize: 12,
    fontWeight: 500
  }}>
            <LogOut size={14} /> Log out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, maxWidth: 1400, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "18px 40px 0" }}>
          <NotificationBell />
        </div>
        <div style={{ padding: "16px 40px 32px" }}>
          <Outlet />
        </div>
      </main>

      <DailyReportWidget />
    </div>
  );
}

function NavItem({ to, icon: Icon, label, end, sidebarOpen }) {
  return (
    <NavLink 
    sidebarOpen={sidebarOpen}
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 10px",
        borderRadius: 8,
        textDecoration: "none",
        background: isActive ? "#E0922F" : "transparent",
        color: isActive ? "#1B2A4A" : "#D7DCE8",
        fontSize: 14,
        fontWeight: isActive ? 700 : 500,
        justifyContent: sidebarOpen ? "flex-start" : "center",
      })}
    >
      <Icon size={16} />
      {sidebarOpen && label}
    </NavLink>
  );
}

function CountrySidebarLink({
  to,
  icon: Icon,
  flag,
  label,
  count,
  sidebarOpen,
}) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: sidebarOpen ? 9 : 0,
        justifyContent: sidebarOpen ? "flex-start" : "center",
        padding: "8px 10px",
        borderRadius: 7,
        textDecoration: "none",
        background: isActive ? "#2E3F63" : "transparent",
        color: isActive ? "#FAF8F3" : "#B7BFD2",
        fontSize: 12.5,
        fontWeight: isActive ? 600 : 500,
      })}
    >
      {Icon ? (
        <Icon size={15} style={{ flexShrink: 0, opacity: 0.85 }} />
      ) : (
        <span style={{ width: 15, textAlign: "center", flexShrink: 0 }}>
          {flag || "🌐"}
        </span>
      )}

      {sidebarOpen && (
  <span style={{ flex: 1 }}>{label}</span>
)}
    </NavLink>
  );
}

