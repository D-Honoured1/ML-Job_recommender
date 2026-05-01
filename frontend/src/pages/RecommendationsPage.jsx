import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
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
  skills_match: {
    label: "Skills Match",
    fullName: "Content-Based Filtering",
    color: "#2557a7", bg: "#e8f0fe", border: "#b8d0f8",
    description: "Your skills and profile were compared to job requirements using TF-IDF similarity.",
  },
  people_like_you: {
    label: "Collaborative",
    fullName: "Collaborative Filtering",
    color: "#007c5f", bg: "#e6f3ef", border: "#a8d4c8",
    description: "Professionals with similar profiles engaged with this role — their behaviour informed this recommendation.",
  },
  best_of_both: {
    label: "Hybrid",
    fullName: "Hybrid Recommendation",
    color: "#7c3aed", bg: "#f3e8ff", border: "#c4b0f0",
    description: "Both skill-profile matching and community behaviour contributed to this recommendation.",
  },
};

const S = {
  page: { minHeight: "100vh", background: C.pageBg, fontFamily: "Arial,Helvetica,sans-serif", color: C.text },

  header: {
    background: C.white, borderBottom: "2px solid #e0dede", padding: "0 1.5rem",
    position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
    height: "56px", display: "flex", alignItems: "center",
  },
  headerInner: {
    maxWidth: "1200px", margin: "0 auto", width: "100%",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  logo: { fontSize: "1.8rem", fontWeight: 900, color: C.blue, textDecoration: "none", letterSpacing: "-1px", fontStyle: "italic" },

  hamburger: {
    position: "relative", width: "40px", height: "40px",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "none", border: `1px solid ${C.border}`, borderRadius: "6px",
    cursor: "pointer", fontSize: "1.2rem", color: C.text,
  },
  menuBadge: {
    position: "absolute", top: "-5px", right: "-5px",
    background: C.red, color: C.white, borderRadius: "50%",
    width: "18px", height: "18px", fontSize: "0.65rem", fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none",
  },
  dropdown: {
    position: "absolute", top: "calc(100% + 8px)", right: 0,
    background: C.white, border: `1px solid ${C.border}`,
    borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    minWidth: "210px", zIndex: 200, overflow: "hidden",
  },
  dropItem: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0.7rem 1rem", fontSize: "0.9rem", color: C.text,
    textDecoration: "none", borderBottom: `1px solid ${C.border}`,
    background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer",
    boxSizing: "border-box",
  },
  itemBadge: {
    background: C.red, color: C.white, borderRadius: "20px",
    padding: "0.1rem 0.45rem", fontSize: "0.68rem", fontWeight: 700,
  },
  signOut: {
    display: "block", padding: "0.7rem 1rem", fontSize: "0.9rem", color: C.red,
    background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer",
  },

  navBtns: { display: "flex", gap: "0.5rem", alignItems: "center" },
  navLink: { padding: "0.45rem 0.9rem", borderRadius: "4px", border: `1px solid ${C.blue}`, color: C.blue, fontWeight: 600, fontSize: "0.85rem", textDecoration: "none", display: "inline-block" },
  navLinkFill: { padding: "0.45rem 0.9rem", borderRadius: "4px", background: C.blue, color: C.white, fontWeight: 600, fontSize: "0.85rem", textDecoration: "none", display: "inline-block", border: "none", cursor: "pointer" },

  profileBanner: { borderBottom: `1px solid ${C.border}`, padding: "0.5rem 1.5rem", background: C.white },
  profileBannerInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "0.65rem", fontSize: "0.88rem", color: C.text2 },
  avatarXs: { width: "28px", height: "28px", borderRadius: "50%", background: C.blue, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 },

  main: { maxWidth: "1200px", margin: "0 auto", padding: "1rem 1.5rem", display: "flex", gap: "1rem", alignItems: "flex-start" },
  leftCol: { flex: "0 0 44%", minWidth: 0 },

  searchBar: {
    display: "flex", border: `1px solid ${C.border}`, borderRadius: "8px",
    overflow: "hidden", background: C.white, marginBottom: "0.75rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  searchInput: { flex: 1, padding: "0.65rem 1rem", border: "none", outline: "none", fontSize: "0.95rem", color: C.text, background: "transparent" },
  searchClear: { padding: "0 0.75rem", border: "none", background: "transparent", color: C.text3, fontSize: "1.1rem", cursor: "pointer" },

  sectionLabel: { fontSize: "0.92rem", color: C.text2, marginBottom: "0.5rem", fontWeight: 600 },
  resultsCount: { fontSize: "0.88rem", color: C.text3, marginBottom: "0.75rem" },

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

  showMoreBtn: {
    width: "100%", padding: "0.75rem", background: C.white, border: `1px solid ${C.border}`,
    borderRadius: "8px", color: C.blue, fontWeight: 600, fontSize: "0.9rem",
    cursor: "pointer", marginTop: "0.5rem", textAlign: "center",
  },

  rightCol: { flex: 1, position: "sticky", top: "68px", maxHeight: "calc(100vh - 80px)", overflowY: "auto" },
  detailPanel: { background: C.white, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "1.5rem 1.75rem" },
  dTitle: { fontSize: "1.4rem", fontWeight: 700, color: C.text, margin: "0 0 0.3rem", lineHeight: 1.3 },
  dCompany: { fontSize: "0.95rem", color: C.text, margin: "0 0 0.15rem" },
  dLocation: { fontSize: "0.9rem", color: C.text3, margin: "0 0 1rem" },
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
    <span style={{ ...S.driverPill, background: d.color, color: "#fff" }} title={d.description}>
      {d.fullName}
    </span>
  );
}

function JobCard({ job, selected, onSelect }) {
  const pct = job.match_score != null ? Math.round(job.match_score * 100) : null;
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
        {pct != null && (
          <div style={S.matchCol}>
            <div style={S.matchPct}>{pct}%</div>
            <div style={S.matchSub}>match</div>
          </div>
        )}
      </div>
      {job.recommendation_reason && (
        <p style={S.cardSnippet}>{job.recommendation_reason}</p>
      )}
      {(job.recommendation_driver || skills.length > 0) && (
        <div style={S.cardBottom}>
          {job.recommendation_driver && <DriverPill driver={job.recommendation_driver} />}
          <div style={S.skillsRow}>
            {skills.slice(0, 3).map((sk) => <span key={sk} style={S.skillChip}>{sk}</span>)}
            {skills.length > 3 && <span style={S.skillChip}>+{skills.length - 3}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function JobDetailPanel({ job, onApply, onBack }) {
  if (!job) {
    return (
      <div style={S.emptyPanel} className="rec-empty-panel">
        <div style={S.emptyIcon}>🔍</div>
        <p style={S.emptyTitle}>Select a job to view details</p>
        <p style={S.emptyHint}>Click any job on the left to see full information</p>
      </div>
    );
  }

  const hasScore = job.match_score != null && job.match_score > 0;
  const pct = hasScore ? Math.round(job.match_score * 100) : null;
  const skills = job.required_skills ? job.required_skills.split(";").map((s) => s.trim()).filter(Boolean) : [];
  const driver = job.recommendation_driver ? (DRIVER_CONFIG[job.recommendation_driver] || DRIVER_CONFIG.skills_match) : null;
  const cbfPct = Math.round((job.cbf_pct ?? 1) * 100);
  const cfPct  = Math.round((job.cf_pct  ?? 0) * 100);

  return (
    <div style={S.detailPanel}>
      <button className="rec-back-btn" onClick={onBack}>← Back to results</button>
      <h1 style={S.dTitle}>{job.job_title}</h1>
      <p style={S.dCompany}>{job.company}</p>
      <p style={S.dLocation}>{job.location}</p>

      {driver && hasScore && (
        <div style={{ background: driver.bg, border: `1px solid ${driver.border}`, borderRadius: "8px", padding: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <span style={{ background: driver.color, color: "#fff", borderRadius: "4px", padding: "0.2rem 0.6rem", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em" }}>
              {driver.fullName.toUpperCase()}
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", color: C.text2, margin: "0 0 0.85rem", lineHeight: 1.5 }}>{driver.description}</p>
          <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: driver.color, lineHeight: 1 }}>{pct}%</div>
              <div style={{ fontSize: "0.72rem", color: C.text3, marginTop: "0.2rem" }}>match score</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.75rem", color: C.text3, marginBottom: "0.4rem", fontWeight: 600 }}>SCORE BREAKDOWN</div>
              <div style={{ marginBottom: "0.35rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "0.2rem" }}>
                  <span style={{ color: "#2557a7", fontWeight: 600 }}>Content-Based</span>
                  <span style={{ color: C.text3 }}>{cbfPct}%</span>
                </div>
                <div style={{ height: "7px", background: "rgba(0,0,0,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${cbfPct}%`, height: "100%", background: "#2557a7", borderRadius: "4px", transition: "width 0.5s ease" }} />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "0.2rem" }}>
                  <span style={{ color: "#007c5f", fontWeight: 600 }}>Collaborative</span>
                  <span style={{ color: C.text3 }}>{cfPct}%</span>
                </div>
                <div style={{ height: "7px", background: "rgba(0,0,0,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${cfPct}%`, height: "100%", background: "#007c5f", borderRadius: "4px", transition: "width 0.5s ease" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

export default function RecommendationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [mobileView, setMobileView] = useState("list");

  // Show More state
  const [visibleCount, setVisibleCount] = useState(10);

  // Fuzzy search state
  const [searchQuery, setSearchQuery] = useState("");
  const [jobCatalogue, setJobCatalogue] = useState([]);
  const [fuseResults, setFuseResults] = useState([]);

  // Nav menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);

  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("access_token");

  // Auto-fetch recommendations and catalogue on mount
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchRecommendations();
    api.get("/jobs/search/")
      .then(({ data: catalogue }) => setJobCatalogue(catalogue))
      .catch(() => {});
    api.get("/notifications/")
      .then(({ data: notifs }) => setUnread(notifs.filter((n) => !n.is_read).length))
      .catch(() => {});
  }, []); // eslint-disable-line

  // Run Fuse.js when search query changes
  useEffect(() => {
    if (!searchQuery.trim() || jobCatalogue.length === 0) {
      setFuseResults([]);
      return;
    }
    const fuse = new Fuse(jobCatalogue, {
      keys: ["job_title", "company", "location", "required_skills"],
      threshold: 0.4,
      includeScore: false,
    });
    setFuseResults(fuse.search(searchQuery.trim()).map((r) => r.item));
  }, [searchQuery, jobCatalogue]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true); setError(null); setData(null); setSelectedJob(null); setMobileView("list"); setVisibleCount(10);
    try {
      const { data: json } = await api.get("/recommendations/?n=50");
      setData(json);
      if (json.recommendations?.length > 0) setSelectedJob(json.recommendations[0]);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const trackInteraction = useCallback(async (jobId, type = "viewed") => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      await api.post("/jobs/interact/", { job_id: jobId, interaction_type: type });
    } catch {}
  }, []);

  const handleApply = useCallback((job) => {
    trackInteraction(job.job_id, "applied");
    const params = new URLSearchParams({ keywords: `${job.job_title} ${job.company}` });
    window.open(`https://www.linkedin.com/jobs/search/?${params.toString()}`, "_blank");
  }, [trackInteraction]);

  const handleSelectJob = useCallback((job) => {
    setSelectedJob(job);
    trackInteraction(job.job_id, "viewed");
    setMobileView("detail");
  }, [trackInteraction]);

  const handleLogout = async () => {
    try { await api.post("/auth/logout/", { refresh: localStorage.getItem("refresh_token") }); } catch {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  const isSearchMode = searchQuery.trim().length > 0;
  const allRecommendations = data?.recommendations || [];
  const displayedJobs = isSearchMode ? fuseResults : allRecommendations.slice(0, visibleCount);
  const profile = data?.profile || null;

  const closeMenu = () => setMenuOpen(false);

  // --- Not logged in view ---
  if (!isLoggedIn) {
    return (
      <div style={{ ...S.page, display: "flex", flexDirection: "column" }}>
        <header style={S.header} className="rec-header">
          <div style={S.headerInner} className="rec-header-inner">
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
      {/* Header */}
      <header style={S.header} className="rec-header">
        <div style={S.headerInner} className="rec-header-inner">
          <Link to="/" style={S.logo}>Skai</Link>

          <div style={{ position: "relative" }} ref={menuRef}>
            <button style={S.hamburger} onClick={() => setMenuOpen((v) => !v)} aria-label="Menu" className="rec-hamburger">
              ☰
              {unread > 0 && <span style={S.menuBadge}>{unread > 99 ? "99+" : unread}</span>}
            </button>

            {menuOpen && (
              <div style={S.dropdown}>
                <Link to="/profile" style={{ ...S.dropItem, borderBottom: `1px solid ${C.border}` }} onClick={closeMenu}>Profile</Link>
                <Link to="/applications" style={{ ...S.dropItem, borderBottom: `1px solid ${C.border}` }} onClick={closeMenu}>My Applications</Link>
                <Link to="/reviews" style={{ ...S.dropItem, borderBottom: `1px solid ${C.border}` }} onClick={closeMenu}>Reviews</Link>
                <Link to="/notifications" style={{ ...S.dropItem, borderBottom: `1px solid ${C.border}` }} onClick={closeMenu}>
                  Notifications
                  {unread > 0 && <span style={S.itemBadge}>{unread > 99 ? "99+" : unread}</span>}
                </Link>
                <div style={{ height: "1px", background: C.border }} />
                <button style={S.signOut} onClick={handleLogout}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile banner */}
      {profile && (
        <div style={S.profileBanner}>
          <div style={S.profileBannerInner}>
            <div style={S.avatarXs}>{(profile.username || "U")[0].toUpperCase()}</div>
            <span>
              <strong>{profile.username}</strong>
              {profile.current_title && ` · ${profile.current_title}`}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div style={{ maxWidth: "1200px", margin: "1rem auto", padding: "0 1.5rem" }}>
          <div style={S.errorBox}>Error: {error}</div>
        </div>
      )}

      <div style={S.main} className="rec-main">
        {/* Left column — job list */}
        <div style={S.leftCol} className={`rec-left-col${mobileView === "detail" ? " hidden" : ""}`}>

          {/* Fuzzy search bar */}
          <div style={S.searchBar} className="rec-search-group">
            <input
              style={S.searchInput}
              type="text"
              placeholder="Search all jobs by title, company, location or skills…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) setVisibleCount(10);
              }}
            />
            {searchQuery && (
              <button style={S.searchClear} onClick={() => { setSearchQuery(""); setVisibleCount(10); }}>✕</button>
            )}
          </div>

          {/* Section label */}
          {!loading && (
            <p style={S.sectionLabel}>
              {isSearchMode
                ? `Search Results for "${searchQuery.trim()}"`
                : "Based on your profile"}
            </p>
          )}

          {loading && <div style={S.spinner}>Finding your best matches…</div>}

          {!loading && !data && !error && !isSearchMode && (
            <div style={S.emptyPanel} className="rec-empty-panel">
              <div style={S.emptyIcon}>💼</div>
              <p style={S.emptyTitle}>Loading your personalised matches…</p>
              <p style={S.emptyHint}>Recommendations are based on your skills and community activity</p>
            </div>
          )}

          {!loading && isSearchMode && fuseResults.length === 0 && (
            <div style={{ ...S.emptyPanel, padding: "2rem" }}>
              <p style={S.emptyTitle}>No results for "{searchQuery.trim()}"</p>
              <p style={S.emptyHint}>Try different keywords or clear the search</p>
            </div>
          )}

          {!loading && !isSearchMode && data && allRecommendations.length === 0 && (
            <div style={{ ...S.emptyPanel, padding: "2rem" }}>
              <p style={S.emptyTitle}>No recommendations yet</p>
              <p style={S.emptyHint}>Complete your profile to get personalised job matches</p>
            </div>
          )}

          {/* Counter */}
          {!loading && displayedJobs.length > 0 && (
            <p style={S.resultsCount}>
              {isSearchMode
                ? `${fuseResults.length} result${fuseResults.length !== 1 ? "s" : ""}`
                : `Showing ${Math.min(visibleCount, allRecommendations.length)} of ${allRecommendations.length} recommendation${allRecommendations.length !== 1 ? "s" : ""}`}
            </p>
          )}

          {/* Job cards */}
          {displayedJobs.map((job) => (
            <JobCard
              key={job.job_id}
              job={job}
              selected={selectedJob?.job_id === job.job_id}
              onSelect={handleSelectJob}
            />
          ))}

          {/* Show More button (recommendations mode only) */}
          {!loading && !isSearchMode && visibleCount < allRecommendations.length && (
            <button
              style={S.showMoreBtn}
              onClick={() => setVisibleCount((v) => v + 10)}
            >
              Show More ({allRecommendations.length - visibleCount} remaining)
            </button>
          )}
        </div>

        {/* Right column — detail panel */}
        <div style={S.rightCol} className={`rec-right-col${mobileView === "detail" ? " show" : ""}`}>
          <JobDetailPanel job={selectedJob} onApply={handleApply} onBack={() => setMobileView("list")} />
        </div>
      </div>
    </div>
  );
}
