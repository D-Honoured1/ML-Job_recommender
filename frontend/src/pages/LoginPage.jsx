import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a,#1e293b)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#e2e8f0", padding: "1rem" },
  card: { background: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "2.5rem 2rem", width: "100%", maxWidth: "420px" },
  logo: { fontSize: "2rem", fontWeight: 800, background: "linear-gradient(90deg,#38bdf8,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.25rem" },
  subtitle: { color: "#64748b", fontSize: "0.9rem", marginBottom: "2rem" },
  label: { display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.4rem" },
  input: { width: "100%", padding: "0.65rem 1rem", borderRadius: "10px", border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", marginBottom: "1rem" },
  btn: { width: "100%", padding: "0.75rem", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#38bdf8,#818cf8)", color: "#0f172a", fontWeight: 700, fontSize: "1rem", cursor: "pointer", marginTop: "0.5rem" },
  error: { background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "8px", padding: "0.75rem 1rem", color: "#fca5a5", marginBottom: "1rem", fontSize: "0.88rem" },
  link: { color: "#38bdf8", textDecoration: "none" },
  footer: { textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "#64748b" },
  backLink: { display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#64748b", textDecoration: "none", fontSize: "0.82rem", marginBottom: "1.25rem" },
};

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login/", form);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.backLink}>← Home</Link>
        <h1 style={s.logo}>HJR-System</h1>
        <p style={s.subtitle}>Sign in to your account</p>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Username</label>
          <input style={s.input} name="username" value={form.username} onChange={handleChange} autoFocus required />
          <label style={s.label}>Password</label>
          <input style={s.input} name="password" type="password" value={form.password} onChange={handleChange} required />
          <button style={s.btn} disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
        </form>
        <p style={s.footer}>No account? <Link to="/register" style={s.link}>Register</Link></p>
      </div>
    </div>
  );
}
