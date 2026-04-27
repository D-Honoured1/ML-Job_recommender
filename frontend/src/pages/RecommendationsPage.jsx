import { useState, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const C = {
  blue: "#2557a7",
  pageBg: "#f3f2f1",
  white: "#ffffff",
  border: "#d4d2d0",
  text: "#2d2d2d",
  text2: "#595959",
  text3: "#767676",
  blueLight: "#e8f0fe",
  red: "#b91c1c",
};

const DRIVER_CONFIG = {
  skills_match:    { label: "Skills Match",    color: "#2557a7", bg: "#e8f0fe", border: "#b8d0f8" },
  people_like_you: { label: "People Like You", color: "#007c5f", bg: "#e6f3ef", border: "#a8d4c8" },
  best_of_both:    { label: "Best of Both",    color: "#7c3aed", bg: "#f3e8ff", border: "#c4b0f0" },
};

const S = {
  page: { minHeight: "100vh", background: C.pageBg, fontFamily: "Arial,Helvetica,sans-serif", color: C.text },

  header: {
    background: C.white, borderBottom: "2px solid #e0dede", padding: "0.75rem 1.5rem",
    position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
  },
  headerInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" },
  logo: { fontSize: "2rem", fontWeight: 900, color: C.blue, textDecoration: "none", letterSpacing: "-1px", fontStyle: "italic", flexShrink: 0 },

  searchGroup: {
    display: "flex", flex: 1, maxWidth: "640px", border: `2px solid ${C.border}`,
    borderRadius: "8px", overflow: "hidden", background: C.white, boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  searchInput: { flex: 1, padding: "0.7rem 1rem", border: "none", outline: "none", fontSize: "0.95rem", color: C.text, background: "transparent" },
  searchDivider: { width: "1px", background: C.border },
  nInput: { width: "72px", padding: "0.7rem 0.5rem", border: "none", borderLeft: `1px solid ${C.border}`, outline: "none", fontSize: "0.95rem", color: C.text, textAlign: "center", background: "transparent" },
  findBtn: { padding: "0.7rem 1.4rem", background: C.blue, color: C.white, border: "none", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" },

  navBtns: { display: "flex", gap: "0.5rem", alignItems: "center", marginLeft: "auto" },
  navLink: { padding: "0.45rem 0.9rem", borderRadius: "4px", border: `1px solid ${C.blue}`, color: C.blue, fontWeight: 600, fontSize: "0.85rem", textDecoration: "none", display: "inline-block" },
  navLinkFill: { padding: "0.45rem 0.9rem", borderRadius: "4px", background: C.blue, color: C.white, fontWeight: 600, fontSize: "0.85rem", textDecoration: "none", display: "inline-block", border: "none", cursor: "pointer" },

  profileBanner: { borderBottom: `1px solid ${C.border}`, padding: "0.5rem 1.5rem", background: C.white },
  profileBannerInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "0.65rem", fontSize: "0.88rem", color: C.text2 },
  avatarXs: { width: "28px", height: "28px", borderRadius: "50%", background: C.blue, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 },

  main: { maxWidth: "1200px", margin: "0 auto", padding: "1rem 1.5rem", display: "flex", gap: "1rem", alignItems: "flex-start" },

  leftCol: { flex: "0 0 44%", minWidth: 0 },
  resultsCount: { fontSize: "0.88rem", color: C.text2, marginBottom: "0.75rem", fontWeight: 600 },

  jobCard: { background: C.white, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "1rem 1.25rem", marginBottom: "0.5rem", cursor: "pointer" },
  jobCardActive: { borderLeft: `4px solid ${C.blue}`, background: "#f0f4ff" },

  cardRow: { display: "flex", gap: "0.8rem", alignItems: "flex-start" },
  companyInitial: { width: "42px", height: "42px", borderRadius: "8px", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem", color: C.blue, background: C.blueLight, flexShrink: 0 },
  cardMeta: { flex: 1, minWidth: 0 },
  jTitle: { fontSize: "0.98rem", fontWeight: 700, color: C.blue, margin: "0 0 0.12rem", lineHeight: 1.3, textDecoration: "underline" },
  jCompany: { fontSize: "0.85rem", color: C.text, margin: "0 0 0.06rem" },
  jLocation: { fontSize: "0.8rem", color: C.text3, margin: 0 },
  matchCol: { flexShrink: 0, textAlign: "right" },
  matchPct: { fontSize: "1.1rem", fontWeight: 800, color: C.blue },
  matchSub: { fontSize: "0.68rem", color: C.text3 },

  cardSnippet: { fontSize: "0.84rem", color: C.text2, margin: "0.5rem 0 0.4rem", lineHeight: 1.55 },
  cardBottom: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.4rem" },
  driverPill: { borderRadius: "20px", padding: "0.15rem 0.6rem", fontSize: "0.72rem", fontWeight: 600 },
  skillsRow: { display: "flex", flexWrap: "wrap", gap: "0.25rem" },
  skillChip: { background: "#f1f1f1", border: `1px solid ${C.border}`, borderRadius: "4px", padding: "0.1rem 0.4rem", fontSize: "0.73rem", color: C.text2 },

  rightCol: { flex: 1, position: "sticky", top: "76px", maxHeight: "calc(100vh - 90px)", overflowY: "auto" },
  detailPanel: { background: C.white, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "1.5rem 1.75rem" },
  dTitle: { fontSize: "1.4rem", fontWeight: 700, color: C.text, margin: "0 0 0.3rem", lineHeight: 1.3 },
  dCompany: { fontSize: "0.95rem", color: C.text, margin: "0 0 0.15rem" },
  dLocation: { fontSize: "0.9rem", color: C.text3, margin: "0 0 1rem" },
  dMatchRow: { display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.25rem" },
  dMatchNum: { fontSize: "2rem", fontWeight: 900, color: C.blue, lineHeight: 1 },
  dMatchLabel: { fontSize: "0.8rem", color: C.text3, marginTop: "0.2rem" },
  applyBtn: { display: "block", width: "100%", boxSizing: "border-box", padding: "0.85rem", background: C.blue, color: C.white, border: "none", borderRadius: "4px", fontWeight: 700, fontSize: "1rem", cursor: "pointer", marginBottom: "0.75rem" },
  hr: { border: "none", borderTop: `1px solid ${C.border}`, margin: "1.25rem 0" },
  sectionTitle: { fontSize: "0.95rem", fontWeight: 700, color: C.text, marginBottom: "0.5rem", marginTop: "1rem" },
  sectionText: { fontSize: "0.9rem", color: C.text2, lineHeight: 1.6, margin: 0 },

  emptyPanel: { background: C.white, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "3.5rem 2rem", textAlign: "center", color: C.text3 },
  emptyIcon: { fontSize: "2.5rem", marginBottom: "0.75rem" },
  emptyTitle: { fontSize: "1rem", fontWeight: 600, margin: "0 0 0.3rem", color: C.text },
  emptyHint: { fontSize: "0.85rem", margin: 0 },

  loginPrompt: { background: C.white, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "3rem 2rem", textAlign: "center", maxWidth: "480px", margin: "3rem auto" },
  loginPromptTitle: { fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: "0 0 0.5rem" },
  loginPromptText: { fontSize: "0.9rem", color: C.text2, margin: "0 0 1.5rem" },
  loginPromptBtn: { display: "inline-block", padding: "0.7rem 2rem", background: C.blue, color: C.white, borderRadius: "4px", fontWeight: 700, fontSize: "1rem", textDecoration: "none" },

  spinner: { padding: "3rem 1rem", textAlign: "center", color: C.text3, fontSize: "0.95rem" },
  errorBox: { background: "#fff0f0", border: "1px solid #f8c4c4", borderRadius: "8px", padding: "0.85rem 1.1rem", color: C.red, fontSize: "0.9rem", marginBottom: "0.75rem" },
};

function DriverPill({ driver }) {
  const d = DRIVER_CONFIG[driver] || DRIVER_CONFIG.skills_match;
  return (
    <span style={{ ...S.driverPill, background: d.bg, color: d.color, border: `1px solid ${d.border}` }}>
      {d.label}
    </span>
  );
}

function JobCard({ job, selected, onSelect }) {
  const pct = Math.round(job.match_score * 100);
  const skills = job.required_skills ? job.required_skills.split(";").map((s) => s.trim()).filter(Boolean) : [];
  const initial = (job.company || "?")[0].toUpperCase();

  return (
    <div
      style={{ ...S.jobCard, ...(selected ? S.jobCardActive : {}) }}
      onClick={() => onSelect(job)}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={S.cardRow}>
        <div style={S.companyInitial}>{initial}</div>
        <div style={S.cardMeta}>
          <p style={S.jTitle}>{job.job_title}</p>
          <p style={S.jCompany}>{job.company}</p>
          <p style={S.jLocation}>{job.location}</p>
        </div>
        <div style={S.matchCol}>
          <div style={S.matchPct}>{pct}%</div>
          <div style={S.matchSub}>match</div>
        </div>
      </div>
      {job.recommendation_reason && (
        <p style={S.cardSnippet}>{job.recommendation_reason}</p>
      )}
      <div style={S.cardBottom}>
        <DriverPill driver={job.recommendation_driver || "skills_match"} />
        <div style={S.skillsRow}>
          {skills.slice(0, 3).map((sk) => <span key={sk} style={S.skillChip}>{sk}</span>)}
          {skills.length > 3 && <span style={S.skillChip}>+{skills.length - 3}</span>}
        </div>
      </div>
    </div>
  );
}

function JobDetailPanel({ job, onApply }) {
  if (!job) {
    return (
      <div style={S.emptyPanel}>
        <div style={S.emptyIcon}>🔍</div>
        <p style={S.emptyTitle}>Select a job to view details</p>
        <p style={S.emptyHint}>Click any job on the left to see full information</p>
      </div>
    );
  }

  const pct = Math.round(job.match_score * 100);
  const skills = job.required_skills ? job.required_skills.split(";").map((s) => s.trim()).filter(Boolean) : [];
  const driver = DRIVER_CONFIG[job.recommendation_driver] || DRIVER_CONFIG.skills_match;

  return (
    <div style={S.detailPanel}>
      <h1 style={S.dTitle}>{job.job_title}</h1>
      <p style={S.dCompany}>{job.company}</p>
      <p style={S.dLocation}>{job.location}</p>

      <div style={S.dMatchRow}>
        <div>
          <div style={S.dMatchNum}>{pct}%</div>
          <div style={S.dMatchLabel}>match score</div>
        </div>
        <DriverPill driver={job.recommendation_driver || "skills_match"} />
      </div>

      <button style={S.applyBtn} onClick={() => onApply(job)}>
        Apply on LinkedIn
      </button>

      <hr style={S.hr} />

      {job.recommendation_reason && (
        <>
          <p style={S.sectionTitle}>Why this job?</p>
          <p style={S.sectionText}>{job.recommendation_reason}</p>
        </>
      )}

      {skills.length > 0 && (
        <>
          <p style={S.sectionTitle}>Required Skills</p>
          <div style={{ ...S.skillsRow, marginTop: "0.4rem" }}>
            {skills.map((sk) => (
              <span key={sk} style={{ ...S.skillChip, fontSize: "0.82rem", padding: "0.22rem 0.6rem" }}>{sk}</span>
            ))}
          </div>
        </>
      )}

      <p style={S.sectionTitle}>How you were matched</p>
      <p style={{ ...S.sectionText, color: driver.color, fontWeight: 600, marginBottom: "0.3rem" }}>{driver.label}</p>
      <p style={S.sectionText}>
        {job.recommendation_driver === "skills_match" && "Matched based on your profile skills and job title."}
        {job.recommendation_driver === "people_like_you" && "Recommended because users with similar backgrounds engaged with this role."}
        {job.recommendation_driver === "best_of_both" && "Both your skills profile and community signals contributed to this match."}
      </p>
    </div>
  );
}

export default function RecommendationsPage() {
  const [titleSearch, setTitleSearch] = useState("");
  const [n, setN] = useState(10);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("access_token");

  const fetchRecommendations = useCallback(async () => {
    setLoading(true); setError(null); setData(null); setSelectedJob(null);
    try {
      const { data: json } = await api.get(`/recommendations/?n=${n}`);
      setData(json);
      if (json.recommendations?.length > 0) setSelectedJob(json.recommendations[0]);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [n]);

  const trackInteraction = useCallback(async (jobId) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      await api.post(
        "/jobs/interact/",
        { job_id: jobId, interaction_type: "viewed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {}
  }, []);

  const handleApply = useCallback((job) => {
    trackInteraction(job.job_id);
    const params = new URLSearchParams({ keywords: `${job.job_title} ${job.company}` });
    window.open(`https://www.linkedin.com/jobs/search/?${params.toString()}`, "_blank");
  }, [trackInteraction]);

  const handleSelectJob = useCallback((job) => {
    setSelectedJob(job);
    trackInteraction(job.job_id);
  }, [trackInteraction]);

  const handleLogout = async () => {
    try { await api.post("/auth/logout/", { refresh: localStorage.getItem("refresh_token") }); } catch {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  const profile = data?.profile || null;
  const allJobs = data?.recommendations || [];

  const displayedJobs = useMemo(() => {
    if (!titleSearch.trim()) return allJobs;
    const q = titleSearch.trim().toLowerCase();
    return allJobs.filter((j) =>
      j.job_title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q)
    );
  }, [allJobs, titleSearch]);

  if (!isLoggedIn) {
    return (
      <div style={{ ...S.page, display: "flex", flexDirection: "column" }}>
        <header style={S.header}>
          <div style={S.headerInner}>
            <Link to="/" style={S.logo}>Skai</Link>
            <div style={S.navBtns}>
              <Link to="/login" style={S.navLink}>Sign in</Link>
              <Link to="/register" style={S.navLinkFill}>Create account</Link>
            </div>
          </div>
        </header>
        <div style={S.loginPrompt}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💼</div>
          <p style={S.loginPromptTitle}>Sign in to see your job matches</p>
          <p style={S.loginPromptText}>
            Skai recommends jobs based on your skills and what professionals like you are applying to.
          </p>
          <Link to="/login" style={S.loginPromptBtn}>Sign in</Link>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: C.text3 }}>
            No account? <Link to="/register" style={{ color: C.blue }}>Create one</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.headerInner}>
          <Link to="/" style={S.logo}>Skai</Link>

          <div style={S.searchGroup}>
            <input
              style={S.searchInput}
              type="text"
              placeholder="Search by job title or company"
              value={titleSearch}
              onChange={(e) => setTitleSearch(e.target.value)}
            />
            <div style={S.searchDivider} />
            <input
              style={S.nInput}
              type="number"
              min={1}
              max={50}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
              title="Number of recommendations"
            />
            <button style={S.findBtn} onClick={fetchRecommendations} disabled={loading}>
              {loading ? "…" : "Find Jobs"}
            </button>
          </div>

          <div style={S.navBtns}>
            <Link to="/profile" style={S.navLink}>Profile</Link>
            <button style={S.navLinkFill} onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </header>

      {profile && (
        <div style={S.profileBanner}>
          <div style={S.profileBannerInner}>
            <div style={S.avatarXs}>{(profile.username || "U")[0].toUpperCase()}</div>
            <span>
              <strong>{profile.username}</strong>
              {profile.current_title && ` · ${profile.current_title}`}
              {data && ` · ${data.count} job${data.count !== 1 ? "s" : ""} found`}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div style={{ maxWidth: "1200px", margin: "1rem auto", padding: "0 1.5rem" }}>
          <div style={S.errorBox}>Error: {error}</div>
        </div>
      )}

      <div style={S.main}>
        <div style={S.leftCol}>
          {!data && !loading && !error && (
            <div style={S.emptyPanel}>
              <div style={S.emptyIcon}>💼</div>
              <p style={S.emptyTitle}>Click Find Jobs to see your personalised matches</p>
              <p style={S.emptyHint}>Recommendations are based on your skills and community activity</p>
            </div>
          )}

          {loading && <div style={S.spinner}>Finding your best matches…</div>}

          {data && !loading && (
            displayedJobs.length === 0 ? (
              <div style={{ ...S.emptyPanel, padding: "2rem" }}>
                <p style={S.emptyTitle}>No jobs match "{titleSearch}"</p>
                <p style={S.emptyHint}>Try a different search term</p>
              </div>
            ) : (
              <>
                <p style={S.resultsCount}>
                  {displayedJobs.length} job{displayedJobs.length !== 1 ? "s" : ""}
                  {titleSearch.trim() && ` matching "${titleSearch.trim()}"`}
                </p>
                {displayedJobs.map((job) => (
                  <JobCard
                    key={job.job_id}
                    job={job}
                    selected={selectedJob?.job_id === job.job_id}
                    onSelect={handleSelectJob}
                  />
                ))}
              </>
            )
          )}
        </div>

        <div style={S.rightCol}>
          <JobDetailPanel job={selectedJob} onApply={handleApply} />
        </div>
      </div>
    </div>
  );
}
