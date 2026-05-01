import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavMenu from "../components/NavMenu";
import api from "../api";

const blue = "#2557a7";
const pageBg = "#f3f2f1";
const white = "#ffffff";
const border = "#d4d2d0";
const text = "#2d2d2d";
const text3 = "#767676";

const S = {
  page: { minHeight: "100vh", background: pageBg, fontFamily: "Arial,Helvetica,sans-serif", color: text },
  main: { maxWidth: "800px", margin: "0 auto", padding: "1.5rem" },
  heading: { fontSize: "1.3rem", fontWeight: 700, color: text, margin: "0 0 0.25rem" },
  sub: { fontSize: "0.9rem", color: text3, margin: "0 0 1.5rem" },
  item: {
    background: white,
    border: `1px solid ${border}`,
    borderRadius: "8px",
    padding: "0.85rem 1.1rem",
    marginBottom: "0.5rem",
    display: "flex",
    gap: "0.75rem",
    alignItems: "flex-start",
  },
  unreadDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: blue,
    flexShrink: 0,
    marginTop: "6px",
  },
  readDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#d1d5db",
    flexShrink: 0,
    marginTop: "6px",
  },
  message: { fontSize: "0.9rem", color: text, margin: "0 0 0.2rem", lineHeight: 1.5 },
  date: { fontSize: "0.78rem", color: text3, margin: 0 },
  empty: {
    background: white,
    border: `1px solid ${border}`,
    borderRadius: "8px",
    padding: "3rem 2rem",
    textAlign: "center",
    color: text3,
  },
  spinner: { padding: "3rem 1rem", textAlign: "center", color: text3, fontSize: "0.95rem" },
  errorBox: { background: "#fff0f0", border: "1px solid #f8c4c4", borderRadius: "8px", padding: "0.85rem 1.1rem", color: "#b91c1c", fontSize: "0.9rem", marginBottom: "1rem" },
};

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/notifications/")
      .then(({ data }) => {
        setNotifications(data);
        // Mark all as read silently
        api.post("/notifications/mark-read/").catch(() => {});
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={S.page}>
      <NavMenu />
      <div style={S.main}>
        <h1 style={S.heading}>Notifications</h1>
        <p style={S.sub}>Your recent activity updates</p>

        {error && <div style={S.errorBox}>Error: {error}</div>}
        {loading && <div style={S.spinner}>Loading…</div>}

        {!loading && !error && notifications.length === 0 && (
          <div style={S.empty}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔔</div>
            <p style={{ fontWeight: 600, margin: "0 0 0.3rem", color: text }}>No notifications yet</p>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              Notifications will appear here when you apply to jobs.{" "}
              <Link to="/" style={{ color: blue }}>Browse jobs</Link>
            </p>
          </div>
        )}

        {!loading && notifications.map((n) => (
          <div key={n.id} style={{ ...S.item, background: n.is_read ? white : "#f0f4ff" }}>
            <div style={n.is_read ? S.readDot : S.unreadDot} />
            <div>
              <p style={S.message}>{n.message}</p>
              <p style={S.date}>{formatDate(n.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
