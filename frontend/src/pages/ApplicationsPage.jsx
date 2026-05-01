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
const blueLight = "#e8f0fe";
const green = "#007c5f";

const S = {
  page: { minHeight: "100vh", background: pageBg, fontFamily: "Arial,Helvetica,sans-serif", color: text },
  main: { maxWidth: "800px", margin: "0 auto", padding: "1.5rem" },
  heading: { fontSize: "1.3rem", fontWeight: 700, color: text, margin: "0 0 0.25rem" },
  sub: { fontSize: "0.9rem", color: text3, margin: "0 0 1.5rem" },
  card: {
    background: white,
    border: `1px solid ${border}`,
    borderRadius: "8px",
    padding: "1rem 1.25rem",
    marginBottom: "0.5rem",
    display: "flex",
    alignItems: "flex-start",
    gap: "0.8rem",
  },
  initial: {
    width: "42px",
    height: "42px",
    borderRadius: "8px",
    border: `1px solid ${border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "1rem",
    color: blue,
    background: blueLight,
    flexShrink: 0,
  },
  meta: { flex: 1 },
  title: { fontSize: "0.98rem", fontWeight: 700, color: blue, margin: "0 0 0.12rem" },
  company: { fontSize: "0.85rem", color: text, margin: "0 0 0.06rem" },
  location: { fontSize: "0.8rem", color: text3, margin: 0 },
  statusRow: { display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.4rem" },
  statusBadge: {
    background: "#e6f3ef",
    color: green,
    border: "1px solid #a8d4c8",
    borderRadius: "20px",
    padding: "0.1rem 0.6rem",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  dateText: { fontSize: "0.78rem", color: text3 },
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
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/applications/")
      .then(({ data }) => setApplications(data))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={S.page}>
      <NavMenu />
      <div style={S.main}>
        <h1 style={S.heading}>My Applications</h1>
        <p style={S.sub}>Jobs you have applied to</p>

        {error && <div style={S.errorBox}>Error: {error}</div>}
        {loading && <div style={S.spinner}>Loading applications…</div>}

        {!loading && !error && applications.length === 0 && (
          <div style={S.empty}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📋</div>
            <p style={{ fontWeight: 600, margin: "0 0 0.3rem", color: text }}>No applications yet</p>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              Click Apply on a job card to track your applications here.{" "}
              <Link to="/" style={{ color: blue }}>Browse jobs</Link>
            </p>
          </div>
        )}

        {!loading && applications.map((app) => (
          <div key={app.job_id} style={S.card}>
            <div style={S.initial}>{(app.company || "?")[0].toUpperCase()}</div>
            <div style={S.meta}>
              <p style={S.title}>{app.job_title}</p>
              <p style={S.company}>{app.company}</p>
              <p style={S.location}>{app.location}</p>
              <div style={S.statusRow}>
                <span style={S.statusBadge}>{app.status}</span>
                <span style={S.dateText}>Applied {formatDate(app.applied_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
