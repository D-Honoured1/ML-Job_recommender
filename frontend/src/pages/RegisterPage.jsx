import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const C = { blue: "#2557a7", border: "#d4d2d0", text: "#2d2d2d", text2: "#595959", text3: "#767676", red: "#b91c1c", green: "#007c5f" };

const S = {
  page: { minHeight: "100vh", background: "#f3f2f1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Arial,Helvetica,sans-serif", color: C.text, padding: "2rem 1.5rem" },
  logo: { fontSize: "2.2rem", fontWeight: 900, color: C.blue, textDecoration: "none", letterSpacing: "-1px", fontStyle: "italic", marginBottom: "1.5rem", display: "block", textAlign: "center" },
  card: { background: "#fff", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "2rem", width: "100%", maxWidth: "440px" },
  heading: { fontSize: "1.25rem", fontWeight: 700, color: C.text, margin: "0 0 1.5rem" },
  label: { display: "block", fontSize: "0.9rem", fontWeight: 600, color: C.text, marginBottom: "0.35rem" },
  input: { width: "100%", padding: "0.65rem 0.9rem", borderRadius: "4px", border: `1px solid ${C.border}`, color: C.text, fontSize: "0.95rem", outline: "none", boxSizing: "border-box", marginBottom: "1rem" },
  btn: { width: "100%", padding: "0.75rem", borderRadius: "4px", border: "none", background: C.blue, color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer", marginTop: "0.25rem" },
  outlineBtn: { width: "100%", padding: "0.65rem", borderRadius: "4px", border: `1px solid ${C.border}`, background: "#fff", color: C.text2, fontSize: "0.9rem", cursor: "pointer", marginBottom: "1rem", textAlign: "center" },
  error: { background: "#fff0f0", border: "1px solid #f8c4c4", borderRadius: "6px", padding: "0.75rem 0.9rem", color: C.red, fontSize: "0.88rem", marginBottom: "1rem" },
  success: { background: "#e6f3ef", border: "1px solid #a8d4c8", borderRadius: "6px", padding: "0.75rem 0.9rem", color: C.green, fontSize: "0.88rem", marginBottom: "1rem" },
  divider: { border: "none", borderTop: `1px solid ${C.border}`, margin: "1.25rem 0" },
  footer: { textAlign: "center", fontSize: "0.88rem", color: C.text2, marginTop: "1.25rem" },
  link: { color: C.blue, textDecoration: "none", fontWeight: 600 },
  backLink: { fontSize: "0.85rem", color: C.text3, textDecoration: "none", marginBottom: "1rem", display: "inline-block" },
  fileArea: { border: `2px dashed ${C.border}`, borderRadius: "6px", padding: "1.5rem", textAlign: "center", cursor: "pointer", color: C.text3, fontSize: "0.88rem", marginBottom: "1rem", background: "#fafafa" },
  orDivider: { textAlign: "center", color: C.text3, fontSize: "0.85rem", margin: "0.75rem 0", position: "relative" },
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
  const focusBlue = (e) => (e.target.style.borderColor = C.blue);
  const blurGray = (e) => (e.target.style.borderColor = C.border);

  const handleResumeUpload = async (file) => {
    if (!file) return;
    setResumeFile(file);
    setLoading(true);
    setError(null);
    try {
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
    <div style={S.page}>
      <Link to="/" style={S.logo}>Skai</Link>
      <div style={S.card}>
        <Link to="/" style={S.backLink}>← Back to jobs</Link>
        <h1 style={S.heading}>Create your account</h1>

        {error && <div style={S.error}>{error}</div>}
        {resumeSkills && <div style={S.success}>Extracted {resumeSkills.length} skills from your resume!</div>}

        <button style={S.outlineBtn} onClick={() => setResumeMode(!resumeMode)}>
          {resumeMode ? "Fill in manually instead" : "📄 Upload Resume PDF"}
        </button>

        {resumeMode && (
          <div style={S.fileArea} onClick={() => fileRef.current.click()}>
            {resumeFile ? `Selected: ${resumeFile.name}` : "Click to select a PDF resume"}
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
              onChange={(e) => handleResumeUpload(e.target.files[0])} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={S.label}>Username *</label>
          <input style={S.input} name="username" value={form.username} onChange={handleChange} required onFocus={focusBlue} onBlur={blurGray} />

          <label style={S.label}>Email</label>
          <input style={S.input} name="email" type="email" value={form.email} onChange={handleChange} onFocus={focusBlue} onBlur={blurGray} />

          <label style={S.label}>Password *</label>
          <input style={S.input} name="password" type="password" value={form.password} onChange={handleChange} required onFocus={focusBlue} onBlur={blurGray} />

          {!resumeMode && (
            <>
              <hr style={S.divider} />
              <label style={S.label}>Current Job Title</label>
              <input style={S.input} name="current_title" value={form.current_title} onChange={handleChange} placeholder="e.g. Software Engineer" onFocus={focusBlue} onBlur={blurGray} />

              <label style={S.label}>Education</label>
              <input style={S.input} name="education" value={form.education} onChange={handleChange} placeholder="e.g. BSc Computer Science" onFocus={focusBlue} onBlur={blurGray} />

              <label style={S.label}>Skills (comma-separated)</label>
              <input style={S.input} name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. Python, Django, SQL" onFocus={focusBlue} onBlur={blurGray} />

              <label style={S.label}>Years of Experience</label>
              <input style={S.input} name="experience_years" type="number" min="0" value={form.experience_years} onChange={handleChange} placeholder="e.g. 3" onFocus={focusBlue} onBlur={blurGray} />
            </>
          )}

          <button style={S.btn} disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={S.footer}>Already have an account? <Link to="/login" style={S.link}>Sign in</Link></p>
      </div>
    </div>
  );
}
