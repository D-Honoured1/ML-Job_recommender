import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a,#1e293b)", fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#e2e8f0", padding: "2rem 1rem" },
  container: { maxWidth: "640px", margin: "0 auto" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
  logo: { fontSize: "1.6rem", fontWeight: 800, background: "linear-gradient(90deg,#38bdf8,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textDecoration: "none" },
  logoutBtn: { padding: "0.45rem 1rem", borderRadius: "8px", border: "1px solid #334155", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: "0.85rem" },
  card: { background: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "2rem" },
  heading: { fontSize: "1.2rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "1.5rem" },
  label: { display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.4rem" },
  input: { width: "100%", padding: "0.65rem 1rem", borderRadius: "10px", border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", marginBottom: "1rem" },
  btn: { padding: "0.65rem 1.5rem", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#38bdf8,#818cf8)", color: "#0f172a", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" },
  outlineBtn: { padding: "0.6rem 1.2rem", borderRadius: "10px", border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: "0.88rem", cursor: "pointer", marginLeft: "0.75rem" },
  error: { background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "8px", padding: "0.75rem 1rem", color: "#fca5a5", marginBottom: "1rem", fontSize: "0.88rem" },
  success: { background: "#052e16", border: "1px solid #166534", borderRadius: "8px", padding: "0.75rem 1rem", color: "#86efac", marginBottom: "1rem", fontSize: "0.88rem" },
  divider: { borderTop: "1px solid #334155", margin: "1.5rem 0" },
  fileArea: { border: "2px dashed #334155", borderRadius: "10px", padding: "1.25rem", textAlign: "center", cursor: "pointer", color: "#64748b", fontSize: "0.88rem", marginBottom: "1rem" },
  chip: { display: "inline-block", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", padding: "0.2rem 0.55rem", fontSize: "0.75rem", color: "#94a3b8", margin: "0.2rem" },
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/profile/")
      .then(({ data }) => { setProfile(data); setForm({ current_title: data.current_title, education: data.education, skills: data.skills, experience_years: data.experience_years }); })
      .catch(() => navigate("/login"));
  }, [navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setLoading(true); setError(null); setMsg(null);
    try {
      const { data } = await api.put("/auth/profile/", form);
      setProfile(data); setEditing(false); setMsg("Profile updated.");
    } catch { setError("Failed to save."); }
    finally { setLoading(false); }
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;
    setLoading(true); setError(null); setMsg(null);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const { data } = await api.post("/auth/profile/resume/", fd);
      setMsg(`Resume uploaded. Extracted ${data.extracted_skills.length} skills.`);
      const updated = await api.get("/auth/profile/");
      setProfile(updated.data);
      setForm((f) => ({ ...f, skills: updated.data.skills }));
    } catch (err) { setError(err.response?.data?.error || "Upload failed."); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await api.post("/auth/logout/", { refresh: localStorage.getItem("refresh_token") }); } catch {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  if (!profile) return <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>Loading…</div>;

  const skills = (profile.skills || "").split(";").map(s2 => s2.trim()).filter(Boolean);

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.nav}>
          <Link to="/" style={s.logo}>HJR-System</Link>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>

        <div style={s.card}>
          <h2 style={s.heading}>{profile.username}</h2>
          <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>{profile.email}</p>

          {error && <div style={s.error}>{error}</div>}
          {msg && <div style={s.success}>{msg}</div>}

          {editing ? (
            <>
              <label style={s.label}>Current Title</label>
              <input style={s.input} name="current_title" value={form.current_title || ""} onChange={handleChange} />
              <label style={s.label}>Education</label>
              <input style={s.input} name="education" value={form.education || ""} onChange={handleChange} />
              <label style={s.label}>Skills (semicolon-separated)</label>
              <input style={s.input} name="skills" value={form.skills || ""} onChange={handleChange} />
              <label style={s.label}>Years of Experience</label>
              <input style={s.input} name="experience_years" type="number" min="0" value={form.experience_years || ""} onChange={handleChange} />
              <button style={s.btn} onClick={handleSave} disabled={loading}>{loading ? "Saving…" : "Save"}</button>
              <button style={s.outlineBtn} onClick={() => setEditing(false)}>Cancel</button>
            </>
          ) : (
            <>
              <p style={s.label}>Title</p>
              <p style={{ marginBottom: "1rem" }}>{profile.current_title || "—"}</p>
              <p style={s.label}>Education</p>
              <p style={{ marginBottom: "1rem" }}>{profile.education || "—"}</p>
              <p style={s.label}>Experience</p>
              <p style={{ marginBottom: "1rem" }}>{profile.experience_years} year{profile.experience_years !== 1 ? "s" : ""}</p>
              <p style={s.label}>Skills</p>
              <div style={{ marginBottom: "1rem" }}>
                {skills.length ? skills.map((sk) => <span key={sk} style={s.chip}>{sk}</span>) : <span style={{ color: "#475569" }}>None</span>}
              </div>
              <button style={s.btn} onClick={() => setEditing(true)}>Edit Profile</button>
            </>
          )}

          <div style={s.divider} />
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.75rem" }}>Resume Upload</h3>
          <div style={s.fileArea} onClick={() => fileRef.current.click()}>
            {profile.resume_file ? "Replace resume (click to upload)" : "Upload PDF resume to auto-fill skills"}
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
              onChange={(e) => handleResumeUpload(e.target.files[0])} />
          </div>
        </div>
      </div>
    </div>
  );
}