import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const C = { blue: "#2557a7", border: "#d4d2d0", text: "#2d2d2d", text2: "#595959", text3: "#767676", red: "#b91c1c", green: "#007c5f" };

const S = {
  page: { minHeight: "100vh", background: "#f3f2f1", fontFamily: "Arial,Helvetica,sans-serif", color: C.text },

  header: { background: "#fff", borderBottom: `2px solid #e0dede`, padding: "0.75rem 1.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.06)" },
  headerInner: { maxWidth: "800px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { fontSize: "1.8rem", fontWeight: 900, color: C.blue, textDecoration: "none", letterSpacing: "-1px", fontStyle: "italic" },
  headerRight: { display: "flex", gap: "0.5rem" },
  navLink: { padding: "0.4rem 0.9rem", borderRadius: "4px", border: `1px solid ${C.border}`, color: C.text2, fontSize: "0.85rem", textDecoration: "none", display: "inline-block", background: "#fff" },
  navLinkBlue: { padding: "0.4rem 0.9rem", borderRadius: "4px", border: "none", background: C.blue, color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" },

  main: { maxWidth: "800px", margin: "2rem auto", padding: "0 1.5rem" },
  card: { background: "#fff", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "2rem", marginBottom: "1rem" },
  cardTitle: { fontSize: "1.1rem", fontWeight: 700, color: C.text, margin: "0 0 1.25rem" },

  profileHeader: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" },
  avatar: { width: "56px", height: "56px", borderRadius: "50%", background: C.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.4rem", flexShrink: 0 },
  profileName: { fontSize: "1.3rem", fontWeight: 700, color: C.text, margin: "0 0 0.15rem" },
  profileEmail: { fontSize: "0.88rem", color: C.text3, margin: 0 },

  label: { display: "block", fontSize: "0.9rem", fontWeight: 600, color: C.text, marginBottom: "0.35rem", marginTop: "0.85rem" },
  value: { fontSize: "0.95rem", color: C.text2, margin: "0 0 0" },
  input: { width: "100%", padding: "0.65rem 0.9rem", borderRadius: "4px", border: `1px solid ${C.border}`, color: C.text, fontSize: "0.95rem", outline: "none", boxSizing: "border-box" },

  chip: { display: "inline-block", background: "#f1f1f1", border: `1px solid ${C.border}`, borderRadius: "4px", padding: "0.2rem 0.55rem", fontSize: "0.8rem", color: C.text2, margin: "0.15rem" },

  btnRow: { display: "flex", gap: "0.5rem", marginTop: "1.25rem" },
  btn: { padding: "0.6rem 1.4rem", borderRadius: "4px", border: "none", background: C.blue, color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" },
  outlineBtn: { padding: "0.6rem 1.2rem", borderRadius: "4px", border: `1px solid ${C.border}`, background: "#fff", color: C.text2, fontSize: "0.9rem", cursor: "pointer" },

  fileArea: { border: `2px dashed ${C.border}`, borderRadius: "6px", padding: "1.25rem", textAlign: "center", cursor: "pointer", color: C.text3, fontSize: "0.88rem", background: "#fafafa" },
  hr: { border: "none", borderTop: `1px solid ${C.border}`, margin: "1.5rem 0" },

  error: { background: "#fff0f0", border: "1px solid #f8c4c4", borderRadius: "6px", padding: "0.75rem 0.9rem", color: C.red, fontSize: "0.88rem", marginBottom: "1rem" },
  success: { background: "#e6f3ef", border: "1px solid #a8d4c8", borderRadius: "6px", padding: "0.75rem 0.9rem", color: C.green, fontSize: "0.88rem", marginBottom: "1rem" },

  loading: { minHeight: "100vh", background: "#f3f2f1", display: "flex", alignItems: "center", justifyContent: "center", color: C.text3, fontFamily: "Arial,Helvetica,sans-serif" },
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
      .then(({ data }) => {
        setProfile(data);
        setForm({ current_title: data.current_title, education: data.education, skills: data.skills, experience_years: data.experience_years });
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setLoading(true); setError(null); setMsg(null);
    try {
      const { data } = await api.put("/auth/profile/", form);
      setProfile(data); setEditing(false); setMsg("Profile updated successfully.");
    } catch { setError("Failed to save changes."); }
    finally { setLoading(false); }
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;
    setLoading(true); setError(null); setMsg(null);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const { data } = await api.post("/auth/profile/resume/", fd);
      setMsg(`Resume uploaded — extracted ${data.extracted_skills.length} skills.`);
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

  const focusBlue = (e) => (e.target.style.borderColor = C.blue);
  const blurGray = (e) => (e.target.style.borderColor = C.border);

  if (!profile) return <div style={S.loading}>Loading…</div>;

  const skills = (profile.skills || "").split(";").map((s) => s.trim()).filter(Boolean);

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.headerInner}>
          <Link to="/" style={S.logo}>Skai</Link>
          <div style={S.headerRight}>
            <Link to="/" style={S.navLink}>Find Jobs</Link>
            <button style={S.navLinkBlue} onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </header>

      <div style={S.main}>
        {/* Profile card */}
        <div style={S.card}>
          <div style={S.profileHeader}>
            <div style={S.avatar}>{(profile.username || "U")[0].toUpperCase()}</div>
            <div>
              <p style={S.profileName}>{profile.username}</p>
              <p style={S.profileEmail}>{profile.email}</p>
            </div>
          </div>

          {error && <div style={S.error}>{error}</div>}
          {msg && <div style={S.success}>{msg}</div>}

          <h2 style={S.cardTitle}>Profile Details</h2>

          {editing ? (
            <>
              <label style={S.label}>Current Title</label>
              <input style={S.input} name="current_title" value={form.current_title || ""} onChange={handleChange} onFocus={focusBlue} onBlur={blurGray} />

              <label style={S.label}>Education</label>
              <input style={S.input} name="education" value={form.education || ""} onChange={handleChange} onFocus={focusBlue} onBlur={blurGray} />

              <label style={S.label}>Skills (semicolon-separated)</label>
              <input style={S.input} name="skills" value={form.skills || ""} onChange={handleChange} onFocus={focusBlue} onBlur={blurGray} />

              <label style={S.label}>Years of Experience</label>
              <input style={S.input} name="experience_years" type="number" min="0" value={form.experience_years || ""} onChange={handleChange} onFocus={focusBlue} onBlur={blurGray} />

              <div style={S.btnRow}>
                <button style={S.btn} onClick={handleSave} disabled={loading}>{loading ? "Saving…" : "Save changes"}</button>
                <button style={S.outlineBtn} onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <label style={S.label}>Current Title</label>
              <p style={S.value}>{profile.current_title || <span style={{ color: C.text3 }}>Not set</span>}</p>

              <label style={S.label}>Education</label>
              <p style={S.value}>{profile.education || <span style={{ color: C.text3 }}>Not set</span>}</p>

              <label style={S.label}>Years of Experience</label>
              <p style={S.value}>{profile.experience_years} year{profile.experience_years !== 1 ? "s" : ""}</p>

              <label style={S.label}>Skills</label>
              <div style={{ marginTop: "0.4rem" }}>
                {skills.length
                  ? skills.map((sk) => <span key={sk} style={S.chip}>{sk}</span>)
                  : <span style={{ color: C.text3, fontSize: "0.9rem" }}>No skills added yet</span>
                }
              </div>

              <div style={S.btnRow}>
                <button style={S.btn} onClick={() => setEditing(true)}>Edit profile</button>
              </div>
            </>
          )}
        </div>

        {/* Resume card */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>Resume</h2>
          <p style={{ fontSize: "0.88rem", color: C.text2, marginBottom: "1rem" }}>
            Upload a PDF resume to automatically extract your skills.
          </p>
          <div style={S.fileArea} onClick={() => fileRef.current.click()}>
            {profile.resume_file ? "Replace resume — click to upload a new PDF" : "Click to upload a PDF resume"}
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
              onChange={(e) => handleResumeUpload(e.target.files[0])} />
          </div>
        </div>
      </div>
    </div>
  );
}
