import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavMenu from "../components/NavMenu";
import api from "../api";

const blue = "#2557a7";
const pageBg = "#f3f2f1";
const white = "#ffffff";
const border = "#d4d2d0";
const text = "#2d2d2d";
const text2 = "#595959";
const text3 = "#767676";
const blueLight = "#e8f0fe";
const gold = "#f59e0b";

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
    marginBottom: "0.75rem",
  },
  cardHeader: { display: "flex", gap: "0.8rem", alignItems: "flex-start" },
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
  jobTitle: { fontSize: "0.98rem", fontWeight: 700, color: blue, margin: "0 0 0.12rem" },
  jobCompany: { fontSize: "0.85rem", color: text, margin: 0 },
  reviewSection: { marginTop: "0.85rem", borderTop: `1px solid ${border}`, paddingTop: "0.85rem" },
  starsRow: { display: "flex", gap: "0.2rem", marginBottom: "0.5rem" },
  star: { fontSize: "1.4rem", cursor: "pointer", lineHeight: 1, userSelect: "none" },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "0.6rem 0.75rem",
    border: `1px solid ${border}`,
    borderRadius: "6px",
    fontSize: "0.88rem",
    color: text,
    resize: "vertical",
    fontFamily: "Arial,Helvetica,sans-serif",
    minHeight: "70px",
    outline: "none",
  },
  submitBtn: {
    marginTop: "0.5rem",
    padding: "0.5rem 1.25rem",
    background: blue,
    color: white,
    border: "none",
    borderRadius: "4px",
    fontWeight: 700,
    fontSize: "0.88rem",
    cursor: "pointer",
  },
  savedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    marginTop: "0.5rem",
    background: "#e6f3ef",
    color: "#007c5f",
    border: "1px solid #a8d4c8",
    borderRadius: "20px",
    padding: "0.2rem 0.65rem",
    fontSize: "0.78rem",
    fontWeight: 600,
  },
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
  editBtn: {
    marginTop: "0.35rem",
    padding: "0.3rem 0.75rem",
    background: "none",
    border: `1px solid ${border}`,
    borderRadius: "4px",
    fontSize: "0.8rem",
    color: text2,
    cursor: "pointer",
  },
};

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={S.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{ ...S.star, color: n <= (hover || value) ? gold : "#d1d5db" }}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewCard({ app, existingReview, onSaved }) {
  const saved = existingReview;
  const [editing, setEditing] = useState(!saved);
  const [rating, setRating] = useState(saved?.rating || 0);
  const [comment, setComment] = useState(saved?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async () => {
    if (!rating) { setErr("Please select a star rating."); return; }
    setSubmitting(true); setErr(null);
    try {
      await api.post("/reviews/", { job_id: app.job_id, rating, comment });
      onSaved({ job_id: app.job_id, rating, comment });
      setEditing(false);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <div style={S.initial}>{(app.company || "?")[0].toUpperCase()}</div>
        <div>
          <p style={S.jobTitle}>{app.job_title}</p>
          <p style={S.jobCompany}>{app.company}</p>
        </div>
      </div>

      <div style={S.reviewSection}>
        {!editing && saved ? (
          <>
            <div style={{ display: "flex", gap: "0.15rem", marginBottom: "0.3rem" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} style={{ fontSize: "1.2rem", color: n <= saved.rating ? gold : "#d1d5db" }}>★</span>
              ))}
            </div>
            {saved.comment && <p style={{ fontSize: "0.88rem", color: text2, margin: "0 0 0.35rem" }}>{saved.comment}</p>}
            <button style={S.editBtn} onClick={() => setEditing(true)}>Edit review</button>
          </>
        ) : (
          <>
            <p style={{ fontSize: "0.82rem", color: text3, margin: "0 0 0.4rem" }}>
              {saved ? "Update your review:" : "Leave a review:"}
            </p>
            <StarRating value={rating} onChange={setRating} />
            <textarea
              style={S.textarea}
              placeholder="Share your experience (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {err && <p style={{ color: "#b91c1c", fontSize: "0.82rem", margin: "0.3rem 0 0" }}>{err}</p>}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button style={S.submitBtn} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving…" : "Submit Review"}
              </button>
              {saved && (
                <button style={{ ...S.editBtn, marginTop: "0.5rem" }} onClick={() => { setEditing(false); setRating(saved.rating); setComment(saved.comment); }}>
                  Cancel
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [applications, setApplications] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/applications/"), api.get("/reviews/")])
      .then(([appsRes, reviewsRes]) => {
        setApplications(appsRes.data);
        const reviewMap = {};
        for (const r of reviewsRes.data) reviewMap[r.job_id] = r;
        setReviews(reviewMap);
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (review) => {
    setReviews((prev) => ({ ...prev, [review.job_id]: review }));
  };

  return (
    <div style={S.page}>
      <NavMenu />
      <div style={S.main}>
        <h1 style={S.heading}>Reviews</h1>
        <p style={S.sub}>Rate and review jobs you applied to</p>

        {error && <div style={S.errorBox}>Error: {error}</div>}
        {loading && <div style={S.spinner}>Loading…</div>}

        {!loading && !error && applications.length === 0 && (
          <div style={S.empty}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⭐</div>
            <p style={{ fontWeight: 600, margin: "0 0 0.3rem", color: text }}>No applications yet</p>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              Apply to jobs to leave reviews.{" "}
              <Link to="/" style={{ color: blue }}>Browse jobs</Link>
            </p>
          </div>
        )}

        {!loading && applications.map((app) => (
          <ReviewCard
            key={app.job_id}
            app={app}
            existingReview={reviews[app.job_id] || null}
            onSaved={handleSaved}
          />
        ))}
      </div>
    </div>
  );
}
