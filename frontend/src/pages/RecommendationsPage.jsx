import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#e2e8f0", padding: "2rem 1rem" },
  container: { maxWidth: "960px", margin: "0 auto" },

  // Nav
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "0.75rem" },
  logo: { fontSize: "2.2rem", fontWeight: 800, background: "linear-gradient(90deg,#38bdf8,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px", textDecoration: "none" },
  navRight: { display: "flex", gap: "0.5rem", alignItems: "center" },
  navBtn: { padding: "0.45rem 1rem", borderRadius: "8px", border: "1px solid #334155", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: "0.85rem", textDecoration: "none" },

  // Personalised header
  personalizedHeader: { marginBottom: "1.5rem" },
  headerTitle: { fontSize: "1.6rem", fontWeight: 800, color: "#f1f5f9", margin: "0 0 0.3rem 0" },
  headerSubtitle: { color: "#64748b", fontSize: "0.9rem", margin: 0 },

  // Profile Summary Card
  profileCard: { background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" },
  profileCardHeader: { display: "flex", alignItems: "center", gap: "1rem" },
  avatarCircle: { width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg,#38bdf8,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem", color: "#0f172a", flexShrink: 0 },
  profileName: { fontWeight: 700, fontSize: "1rem", color: "#f1f5f9" },
  profileTitle: { fontSize: "0.8rem", color: "#64748b", marginTop: "0.1rem" },
  profileStats: { marginLeft: "auto", textAlign: "right" },
  statNum: { fontSize: "1.4rem", fontWeight: 800, color: "#38bdf8", lineHeight: 1 },
  statLabel: { fontSize: "0.7rem", color: "#64748b", marginTop: "0.1rem" },
  profileSkillChip: { background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", borderRadius: "4px", padding: "0.15rem 0.5rem", fontSize: "0.72rem", color: "#38bdf8" },
  weightBarWrap: { marginTop: "1rem" },
  weightBarLabels: { display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" },
  weightBarTrack: { height: "8px", background: "#0f172a", borderRadius: "99px", overflow: "hidden", display: "flex" },

  // Legend
  legend: { display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "0.75rem", alignItems: "center" },
  legendItem: { display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "#94a3b8" },

  // How this works
  howItWorks: { marginBottom: "1.5rem" },
  howItWorksToggle: { background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.8rem", padding: 0, display: "flex", alignItems: "center", gap: "0.35rem" },
  howItWorksBody: { marginTop: "0.75rem", background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" },
  howItWorksLine: { fontSize: "0.82rem", color: "#94a3b8", margin: 0 },

  // Search bar
  searchBar: { display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" },
  input: { flex: 1, minWidth: "180px", padding: "0.65rem 1rem", borderRadius: "10px", border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: "0.95rem", outline: "none" },
  nInput: { width: "80px", padding: "0.65rem 0.75rem", borderRadius: "10px", border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: "0.95rem", outline: "none" },
  button: { padding: "0.65rem 1.5rem", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#38bdf8,#818cf8)", color: "#0f172a", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", whiteSpace: "nowrap" },

  // Section headers / dividers
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", marginTop: "1.5rem" },
  sectionTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#e2e8f0" },
  sectionCount: { fontSize: "0.75rem", color: "#64748b" },
  sectionDivider: { display: "flex", alignItems: "center", gap: "1rem", margin: "2rem 0 1.5rem 0" },
  sectionDividerLine: { flex: 1, height: "1px", background: "#334155" },
  sectionDividerText: { fontSize: "0.78rem", color: "#64748b", whiteSpace: "nowrap" },

  // Grid & cards
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "0.85rem" },
  card: { background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "0.9rem", transition: "border-color 0.2s,box-shadow 0.2s", display: "flex", flexDirection: "column", gap: "0.5rem", cursor: "pointer" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.4rem" },
  jobTitle: { fontSize: "0.83rem", fontWeight: 700, color: "#f1f5f9", margin: "0.2rem 0 0.1rem", lineHeight: 1.3 },
  company: { fontSize: "0.75rem", color: "#38bdf8" },
  location: { fontSize: "0.7rem", color: "#64748b", marginTop: "0.05rem" },
  scoreBox: { textAlign: "right", flexShrink: 0 },
  scoreLabel: { fontSize: "0.62rem", color: "#64748b", marginBottom: "0.1rem" },
  scoreValue: { fontSize: "0.95rem", fontWeight: 800, color: "#38bdf8" },
  progressTrack: { height: "4px", background: "#0f172a", borderRadius: "99px", marginTop: "0.15rem", overflow: "hidden", width: "50px", marginLeft: "auto" },
  progressBar: (pct) => ({ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#38bdf8,#818cf8)", borderRadius: "99px", transition: "width 0.6s ease" }),
  reasonLine: { fontSize: "0.7rem", color: "#64748b", fontStyle: "italic", margin: 0 },
  divider: { borderTop: "1px solid #334155", margin: "0" },
  skillsRow: { display: "flex", flexWrap: "wrap", gap: "0.25rem" },
  skillChip: { background: "#0f172a", border: "1px solid #334155", borderRadius: "4px", padding: "0.1rem 0.35rem", fontSize: "0.65rem", color: "#94a3b8" },
  applyBtn: { display: "inline-block", padding: "0.3rem 0.7rem", borderRadius: "6px", background: "linear-gradient(135deg,#38bdf8,#818cf8)", color: "#0f172a", fontWeight: 700, fontSize: "0.72rem", textDecoration: "none", border: "none", cursor: "pointer", alignSelf: "flex-start", marginTop: "auto" },

  // States
  emptyState: { textAlign: "center", padding: "4rem 1rem", color: "#475569" },
  error: { background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "10px", padding: "1rem 1.25rem", color: "#fca5a5", marginBottom: "1.5rem", fontSize: "0.9rem" },
  spinner: { textAlign: "center", padding: "3rem", color: "#475569", fontSize: "0.95rem" },
};

// ─── Driver Badge ─────────────────────────────────────────────────────────────
const DRIVER_CONFIG = {
  skills_match:   { label: "Skills Match",    color: "#0ea5e9", bg: "rgba(14,165,233,0.12)",  border: "rgba(14,165,233,0.4)" },
  people_like_you:{ label: "People Like You", color: "#22c55e", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.4)" },
  best_of_both:   { label: "Best of Both",    color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.4)" },
};

function DriverBadge({ driver }) {
  const c = DRIVER_CONFIG[driver] || DRIVER_CONFIG.skills_match;
  return (
    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: "4px", padding: "0.12rem 0.45rem", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.03em", display: "inline-block" }}>
      {c.label}
    </span>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, onTrack, onApply }) {
  const pct = Math.round(job.match_score * 100);
  const skills = job.required_skills ? job.required_skills.split(";").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div
      style={S.card}
      onClick={() => onTrack(job.job_id)}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#475569"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <DriverBadge driver={job.recommendation_driver || "skills_match"} />
      <div style={S.cardTop}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={S.jobTitle}>{job.job_title}</p>
          <p style={S.company}>{job.company}</p>
          <p style={S.location}>{job.location}</p>
        </div>
        <div style={S.scoreBox}>
          <p style={S.scoreLabel}>Match</p>
          <p style={S.scoreValue}>{pct}%</p>
          <div style={S.progressTrack}><div style={S.progressBar(pct)} /></div>
        </div>
      </div>
      {job.recommendation_reason && (
        <p style={S.reasonLine}>{job.recommendation_reason}</p>
      )}
      <div style={S.divider} />
      <div style={S.skillsRow}>
        {skills.slice(0, 4).map((skill) => <span key={skill} style={S.skillChip}>{skill}</span>)}
        {skills.length > 4 && <span style={S.skillChip}>+{skills.length - 4}</span>}
      </div>
      <button
        style={S.applyBtn}
        onClick={(e) => { e.stopPropagation(); onApply(job); }}
      >
        Apply on LinkedIn
      </button>
    </div>
  );
}

// ─── Profile Summary Card ─────────────────────────────────────────────────────
function ProfileSummaryCard({ profile, count, alpha, beta }) {
  const skills = profile?.skills ? profile.skills.split(";").map((s) => s.trim()).filter(Boolean) : [];
  const topSkills = skills.slice(0, 5);
  const cbfPct = Math.round(alpha * 100);
  const cfPct = Math.round(beta * 100);

  return (
    <div style={S.profileCard}>
      <div style={S.profileCardHeader}>
        <div style={S.avatarCircle}>{(profile?.username || "U")[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={S.profileName}>{profile?.username}</div>
          {profile?.current_title && <div style={S.profileTitle}>{profile.current_title}</div>}
        </div>
        <div style={S.profileStats}>
          <div style={S.statNum}>{count}</div>
          <div style={S.statLabel}>matches found</div>
        </div>
      </div>
      {topSkills.length > 0 && (
        <div style={{ ...S.skillsRow, marginTop: "0.85rem" }}>
          {topSkills.map((s) => <span key={s} style={S.profileSkillChip}>{s}</span>)}
        </div>
      )}
      <div style={S.weightBarWrap}>
        <div style={S.weightBarLabels}>
          <span style={{ color: "#38bdf8", fontSize: "0.73rem" }}>Skills Matching {cbfPct}%</span>
          <span style={{ color: "#a78bfa", fontSize: "0.73rem" }}>Community Matching {cfPct}%</span>
        </div>
        <div style={S.weightBarTrack}>
          <div style={{ height: "100%", width: `${cbfPct}%`, background: "#38bdf8", borderRadius: cbfPct === 100 ? "99px" : "99px 0 0 99px", transition: "width 0.5s ease" }} />
          <div style={{ height: "100%", width: `${cfPct}%`, background: "#a78bfa", borderRadius: cfPct === 100 ? "99px" : "0 99px 99px 0", transition: "width 0.5s ease" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={S.legend}>
      {Object.entries(DRIVER_CONFIG).map(([key, c]) => (
        <div key={key} style={S.legendItem}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: c.bg, border: `1px solid ${c.border}`, display: "inline-block", flexShrink: 0 }} />
          <span style={{ color: c.color, fontWeight: 600 }}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── How This Works ───────────────────────────────────────────────────────────
function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <div style={S.howItWorks}>
      <button style={S.howItWorksToggle} onClick={() => setOpen((v) => !v)}>
        How this works {open ? "▲" : "▼"}
      </button>
      {open && (
        <div style={S.howItWorksBody}>
          <p style={S.howItWorksLine}><strong style={{ color: "#0ea5e9" }}>Skills Match</strong> — The system compared your profile skills and title to job requirements.</p>
          <p style={S.howItWorksLine}><strong style={{ color: "#22c55e" }}>People Like You</strong> — The system found users with similar backgrounds and recommended jobs they engaged with.</p>
          <p style={S.howItWorksLine}><strong style={{ color: "#a78bfa" }}>Best of Both</strong> — Both your skills profile and community signals were used together.</p>
        </div>
      )}
    </div>
  );
}

// ─── Results Section ──────────────────────────────────────────────────────────
function ResultsSection({ title, jobs, onTrack, onApply }) {
  if (!jobs.length) return null;
  return (
    <>
      <div style={S.sectionHeader}>
        <span style={S.sectionTitle}>{title}</span>
        <span style={S.sectionCount}>{jobs.length} job{jobs.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={S.grid}>
        {jobs.map((job) => (
          <JobCard key={job.job_id} job={job} onTrack={onTrack} onApply={onApply} />
        ))}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RecommendationsPage() {
  const [userId, setUserId] = useState("U001");
  const [n, setN] = useState(10);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("access_token");

  const fetchRecommendations = useCallback(async () => {
    setLoading(true); setError(null); setData(null);
    try {
      const params = isLoggedIn ? `?n=${n}` : `?user_id=${encodeURIComponent(userId.trim())}&n=${n}`;
      const { data: json } = await api.get(`/recommendations/${params}`);
      setData(json);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, n, isLoggedIn]);

  const trackInteraction = useCallback(async (jobId) => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem("access_token");
    try {
      await api.post(
        "/jobs/interact/",
        { job_id: jobId, interaction_type: "viewed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {}
  }, [isLoggedIn]);

  const handleApply = useCallback((job) => {
    trackInteraction(job.job_id);
    const params = new URLSearchParams({ keywords: `${job.job_title} ${job.company}` });
    window.open(`https://www.linkedin.com/jobs/search/?${params.toString()}`, "_blank");
  }, [trackInteraction]);

  const handleLogout = async () => {
    try { await api.post("/auth/logout/", { refresh: localStorage.getItem("refresh_token") }); } catch {}
    localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  const profile = data?.profile || null;
  const topSkills = profile?.skills ? profile.skills.split(";").map((s) => s.trim()).filter(Boolean).slice(0, 3) : [];

  const profileJobs = data?.recommendations?.filter((j) => j.recommendation_driver === "skills_match" || j.recommendation_driver === "best_of_both") || [];
  const communityJobs = data?.recommendations?.filter((j) => j.recommendation_driver === "people_like_you") || [];
  const hasBothSections = profileJobs.length > 0 && communityJobs.length > 0;

  return (
    <div style={S.page}>
      <div style={S.container}>

        {/* Nav */}
        <div style={S.nav}>
          <div>
            <div style={S.logo}>Skai</div>
          </div>
          <div style={S.navRight}>
            {isLoggedIn ? (
              <>
                <Link to="/profile" style={S.navBtn}>Profile</Link>
                <button style={S.navBtn} onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" style={S.navBtn}>Login</Link>
                <Link to="/register" style={S.navBtn}>Register</Link>
              </>
            )}
          </div>
        </div>

        {/* Personalised header */}
        {isLoggedIn && profile && (
          <div style={S.personalizedHeader}>
            <h1 style={S.headerTitle}>Recommended for You, {profile.username}</h1>
            {(profile.current_title || topSkills.length > 0) && (
              <p style={S.headerSubtitle}>
                {profile.current_title}
                {profile.current_title && topSkills.length > 0 ? " · " : ""}
                {topSkills.join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Profile Summary Card */}
        {isLoggedIn && data && profile && (
          <ProfileSummaryCard
            profile={profile}
            count={data.count}
            alpha={data.weights.alpha}
            beta={data.weights.beta}
          />
        )}

        {/* Legend */}
        {data && <Legend />}

        {/* How this works */}
        <HowItWorks />

        {/* Search controls */}
        <div style={S.searchBar}>
          {!isLoggedIn && (
            <input
              style={S.input}
              type="text"
              placeholder="User ID  e.g. U001"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchRecommendations()}
            />
          )}
          <input
            style={S.nInput}
            type="number"
            min={1}
            max={50}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            title="Number of recommendations"
          />
          <button style={S.button} onClick={fetchRecommendations} disabled={loading}>
            {loading ? "Loading…" : "Recommend"}
          </button>
        </div>

        {error && <div style={S.error}>Error: {error}</div>}
        {loading && <div style={S.spinner}>Generating recommendations…</div>}

        {/* Results */}
        {data && !loading && (
          data.recommendations.length === 0
            ? <div style={S.emptyState}><p>No recommendations found.</p></div>
            : hasBothSections
              ? (
                <>
                  <ResultsSection
                    title="Based on your profile"
                    jobs={profileJobs}
                    onTrack={trackInteraction}
                    onApply={handleApply}
                  />
                  <div style={S.sectionDivider}>
                    <div style={S.sectionDividerLine} />
                    <span style={S.sectionDividerText}>Based on people like you</span>
                    <div style={S.sectionDividerLine} />
                  </div>
                  <ResultsSection
                    title=""
                    jobs={communityJobs}
                    onTrack={trackInteraction}
                    onApply={handleApply}
                  />
                </>
              )
              : (
                <ResultsSection
                  title={communityJobs.length > 0 ? "Based on people like you" : "Based on your profile"}
                  jobs={[...profileJobs, ...communityJobs]}
                  onTrack={trackInteraction}
                  onApply={handleApply}
                />
              )
        )}

        {!data && !loading && !error && (
          <div style={S.emptyState}>
            <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</p>
            <p>{isLoggedIn ? "Click Recommend to see your personalised jobs." : "Enter a User ID and click Recommend to get started."}</p>
            {!isLoggedIn && <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>Sample IDs: U001 – U500</p>}
          </div>
        )}
      </div>
    </div>
  );
}
