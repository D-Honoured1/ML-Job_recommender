import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const C = { blue: "#2557a7", border: "#d4d2d0", text: "#2d2d2d", text2: "#595959", text3: "#767676", red: "#b91c1c" };

const S = {
  page: { minHeight: "100vh", background: "#f3f2f1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Arial,Helvetica,sans-serif", color: C.text, padding: "1.5rem" },
  logo: { fontSize: "2.2rem", fontWeight: 900, color: C.blue, textDecoration: "none", letterSpacing: "-1px", fontStyle: "italic", marginBottom: "1.5rem", display: "block", textAlign: "center" },
  card: { background: "#fff", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "2rem 2rem", width: "100%", maxWidth: "400px" },
  heading: { fontSize: "1.25rem", fontWeight: 700, color: C.text, margin: "0 0 1.5rem" },
  label: { display: "block", fontSize: "0.9rem", fontWeight: 600, color: C.text, marginBottom: "0.35rem" },
  input: { width: "100%", padding: "0.65rem 0.9rem", borderRadius: "4px", border: `1px solid ${C.border}`, color: C.text, fontSize: "0.95rem", outline: "none", boxSizing: "border-box", marginBottom: "1rem" },
  btn: { width: "100%", padding: "0.75rem", borderRadius: "4px", border: "none", background: C.blue, color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer", marginTop: "0.25rem" },
  error: { background: "#fff0f0", border: "1px solid #f8c4c4", borderRadius: "6px", padding: "0.75rem 0.9rem", color: C.red, fontSize: "0.88rem", marginBottom: "1rem" },
  divider: { border: "none", borderTop: `1px solid ${C.border}`, margin: "1.5rem 0" },
  footer: { textAlign: "center", fontSize: "0.88rem", color: C.text2 },
  link: { color: C.blue, textDecoration: "none", fontWeight: 600 },
  backLink: { fontSize: "0.85rem", color: C.text3, textDecoration: "none", marginBottom: "1rem", display: "inline-block" },
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
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page} className="login-page">
      <Link to="/" style={S.logo} className="login-logo">HJR System</Link>
      <div style={S.card} className="login-card">
        <Link to="/" style={S.backLink}>← Back to jobs</Link>
        <h1 style={S.heading}>Sign in to your account</h1>

        {error && <div style={S.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={S.label}>Username</label>
          <input
            style={S.input}
            name="username"
            value={form.username}
            onChange={handleChange}
            autoFocus
            required
            onFocus={(e) => (e.target.style.borderColor = C.blue)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
          <label style={S.label}>Password</label>
          <input
            style={S.input}
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            onFocus={(e) => (e.target.style.borderColor = C.blue)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
          <button style={S.btn} className="login-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <hr style={S.divider} />
        <p style={S.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={S.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
