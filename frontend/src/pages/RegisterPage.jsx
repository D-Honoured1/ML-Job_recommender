import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a,#1e293b)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#e2e8f0", padding: "2rem 1rem" },
  card: { background: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "2.5rem 2rem", width: "100%", maxWidth: "480px" },
  logo: { fontSize: "2rem", fontWeight: 800, background: "linear-gradient(90deg,#38bdf8,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.25rem" },
  subtitle: { color: "#64748b", fontSize: "0.9rem", marginBottom: "2rem" },
  label: { display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.4rem" },
  input: { width: "100%", padding: "0.65rem 1rem", borderRadius: "10px", border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", marginBottom: "1rem" },
  btn: { width: "100%", padding: "0.75rem", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#38bdf8,#818cf8)", color: "#0f172a", fontWeight: 700, fontSize: "1rem", cursor: "pointer", marginTop: "0.5rem" },
  outlineBtn: { width: "100%", padding: "0.65rem", borderRadius: "10px", border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: "0.9rem", cursor: "pointer", marginBottom: "1.5rem" },
  error: { background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "8px", padding: "0.75rem 1rem", color: "#fca5a5", marginBottom: "1rem", fontSize: "0.88rem" },
  success: { background: "#052e16", border: "1px solid #166534", borderRadius: "8px", padding: "0.75rem 1rem", color: "#86efac", marginBottom: "1rem", fontSize: "0.88rem" },
  link: { color: "#38bdf8", textDecoration: "none" },
  footer: { textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "#64748b" },
  divider: { textAlign: "center", color: "#334155", margin: "1rem 0", fontSize: "0.85rem" },
  backLink: { display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#64748b", textDecoration: "none", fontSize: "0.82rem", marginBottom: "1.25rem" },
  fileArea: { border: "2px dashed #334155", borderRadius: "10px", padding: "1.5rem", textAlign: "center", cursor: "pointer", marginBottom: "1rem", color: "#64748b", fontSize: "0.88rem" },
};

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", current_title: "", education: "", skills: "", experience_years: "" });
  const [resumeMode, setResumeMode] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeSkills, setResumeSkills] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleResumeUpload = async (file) => {
    if (!file) return;
    setResumeFile(file);
    setLoading(true);
    setError(null);
    try {
      // We need auth first — register minimal account then upload
      const regData = { username: form.username, email: form.email, password: form.password };
      if (!regData.username || !regData.password) {
        setError("Fill in username and password before uploading a resume.");
        setLoading(false);
        return;
      }
      const { data: regRes } = await api.post("/auth/register/", regData);
      localStorage.setItem("access_token", regRes.access);
      localStorage.setItem("refresh_token", regRes.refresh);

      const fd = new FormData();
      fd.append("resume", file);
      const { data } = await api.post("/auth/profile/resume/", fd);
      setResumeSkills(data.extracted_skills);
      setForm((f) => ({ ...f, skills: data.extracted_skills.join(", ") }));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || JSON.stringify(err.response?.data) || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = { ...form, experience_years: parseInt(form.experience_years) || 0 };
      const { data } = await api.post("/auth/register/", payload);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      navigate("/");
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === "object" ? Object.values(d).flat().join(" ") : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.backLink}>← Home</Link>
        <h1 style={s.logo}>HJR-System</h1>
        <p style={s.subtitle}>Create your account</p>

        {error && <div style={s.error}>{error}</div>}
        {resumeSkills && <div style={s.success}>Extracted {resumeSkills.length} skills from resume!</div>}

        <div style={s.divider}>— fill in manually or upload a resume —</div>
        <button style={s.outlineBtn} onClick={() => { setResumeMode(!resumeMode); }}>
          {resumeMode ? "Fill in manually instead" : "Upload Resume PDF"}
        </button>

        {resumeMode && (
          <div style={s.fileArea} onClick={() => fileRef.current.click()}>
            {resumeFile ? `Selected: ${resumeFile.name}` : "Click to select a PDF resume"}
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
              onChange={(e) => handleResumeUpload(e.target.files[0])} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Username *</label>
          <input style={s.input} name="username" value={form.username} onChange={handleChange} required />
          <label style={s.label}>Email</label>
          <input style={s.input} name="email" type="email" value={form.email} onChange={handleChange} />
          <label style={s.label}>Password *</label>
          <input style={s.input} name="password" type="password" value={form.password} onChange={handleChange} required />
          {!resumeMode && (
            <>
              <label style={s.label}>Current Job Title</label>
              <input style={s.input} name="current_title" value={form.current_title} onChange={handleChange} placeholder="e.g. Software Engineer" />
              <label style={s.label}>Education</label>
              <input style={s.input} name="education" value={form.education} onChange={handleChange} placeholder="e.g. BSc Computer Science" />
              <label style={s.label}>Skills (comma-separated)</label>
              <input style={s.input} name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. Python, Django, SQL" />
              <label style={s.label}>Years of Experience</label>
              <input style={s.input} name="experience_years" type="number" min="0" value={form.experience_years} onChange={handleChange} placeholder="e.g. 3" />
            </>
          )}
          <button style={s.btn} disabled={loading}>{loading ? "Creating account…" : "Create Account"}</button>
        </form>
        <p style={s.footer}>Already have an account? <Link to="/login" style={s.link}>Sign in</Link></p>
      </div>
    </div>
  );
}
