"""
Standalone test for the HJR System Hybrid Recommender Engine.

Run from project root:
    python backend/test_recommender.py

No Django server required.
"""

import sys
import os

# Ensure the backend package is importable without Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd

from recommender.engine import HybridRecommender

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
SEP  = "=" * 72
SEP2 = "-" * 72


def load_data():
    job_df         = pd.read_csv(os.path.join(DATA_DIR, "jobs.csv"))
    user_df        = pd.read_csv(os.path.join(DATA_DIR, "users.csv"))
    interaction_df = pd.read_csv(os.path.join(DATA_DIR, "interactions.csv"))

    for df, col in [(job_df, "job_id"), (user_df, "user_id"),
                    (interaction_df, "user_id"), (interaction_df, "job_id")]:
        df[col] = df[col].astype(str)

    return job_df, user_df, interaction_df


def print_results(results, indent=4):
    pad = " " * indent
    header = f"{pad}{'#':<4} {'Job Title':<42} {'Company':<26} {'Score':>7}"
    print(header)
    print(pad + "-" * (len(header) - indent))
    for i, r in enumerate(results, 1):
        print(f"{pad}{i:<4} {r['job_title'][:40]:<42} {r['company'][:24]:<26} {r['match_score']:>7.4f}")


def cbf_top_n(recommender, user_row, n=5):
    """Score and rank purely via CBF (no CF), return top-n result dicts."""
    scores = recommender._cbf.score(user_row)
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]
    out = []
    for job_id, score in ranked:
        if job_id in recommender._job_df.index:
            job = recommender._job_df.loc[job_id]
            out.append({
                "job_id":      job_id,
                "job_title":   str(job.get("job_title", "")),
                "company":     str(job.get("company", "")),
                "match_score": round(float(score), 4),
            })
    return out


# ---------------------------------------------------------------------------
# 1. Load data & build engine
# ---------------------------------------------------------------------------
print(SEP)
print("  SKAI HYBRID RECOMMENDER — TEST SUITE")
print(SEP)
print("Loading datasets …")
job_df, user_df, interaction_df = load_data()
print(f"  Jobs         : {len(job_df):,}")
print(f"  Users        : {len(user_df):,}")
print(f"  Interactions : {len(interaction_df):,}")

print("\nBuilding HybridRecommender …")
recommender = HybridRecommender(job_df, user_df, interaction_df)
print("  Engine ready.\n")


# ---------------------------------------------------------------------------
# TEST 1 — CBF: temporary test-user profile
# ---------------------------------------------------------------------------
print(SEP)
print("  TEST 1 — Content-Based Filtering  (Temporary User Profile)")
print(SEP)

temp_profile = pd.Series({
    "current_title": "Python Developer",
    "education":     "BSc Computer Science",
    "skills":        "Python; Django; REST APIs",
})

print("  User Profile")
print(f"    Title      : {temp_profile['current_title']}")
print(f"    Education  : {temp_profile['education']}")
print(f"    Skills     : {temp_profile['skills']}")
print(f"    Experience : 2 years")
print(f"    Interactions: 0  → pure CBF (no history)")

alpha_cbf, beta_cbf = 1.0, 0.0
print(f"\n  Weights → α (CBF) = {alpha_cbf},  β (CF) = {beta_cbf}")
print(f"\n  Top 5 Recommendations:")
t1_results = cbf_top_n(recommender, temp_profile, n=5)
print_results(t1_results)


# ---------------------------------------------------------------------------
# TEST 2 — CF: user with the most positive interactions
# ---------------------------------------------------------------------------
print(f"\n{SEP}")
print("  TEST 2 — Collaborative Filtering  (Most-Active CSV User)")
print(SEP)

interaction_counts = (
    interaction_df[interaction_df["interaction"] == 1]
    .groupby("user_id")["job_id"]
    .count()
    .sort_values(ascending=False)
)
top_uid   = interaction_counts.index[0]
top_count = int(interaction_counts.iloc[0])

print(f"  Most-active user  : {top_uid}  ({top_count} positive interactions)")

alpha_t2, beta_t2 = recommender._dynamic_weights(top_uid)
print(f"  Dynamic weights   : α (CBF) = {alpha_t2},  β (CF) = {beta_t2}")
print(f"\n  Top 5 Recommendations:")
t2_results = recommender.recommend(user_id=top_uid, n=5)
print_results(t2_results)


# ---------------------------------------------------------------------------
# TEST 3 — Hybrid comparison: pure CBF vs dynamic weights (same user)
# ---------------------------------------------------------------------------
print(f"\n{SEP}")
print(f"  TEST 3 — Hybrid Comparison for {top_uid}")
print(f"           Pure CBF (β=0) vs Dynamic (α={alpha_t2}, β={beta_t2})")
print(SEP)

if top_uid in recommender._user_df.index:
    top_user_row = recommender._user_df.loc[top_uid]
else:
    top_user_row = pd.Series({"current_title": "", "education": "", "skills": ""})

pure_cbf_results = cbf_top_n(recommender, top_user_row, n=5)
hybrid_results   = t2_results  # already computed above

COL = 43
print(f"\n  {'Pure CBF  (α=1.0, β=0.0)':<{COL}}  {'Dynamic Hybrid (α='+str(alpha_t2)+', β='+str(beta_t2)+')'}")
print(f"  {'-'*COL}  {'-'*COL}")
for i, (cbf_r, hyb_r) in enumerate(zip(pure_cbf_results, hybrid_results), 1):
    cbf_str = f"{i}. {cbf_r['job_title'][:28]:<28} {cbf_r['match_score']:.4f}"
    hyb_str = f"{i}. {hyb_r['job_title'][:28]:<28} {hyb_r['match_score']:.4f}"
    print(f"  {cbf_str:<{COL}}  {hyb_str}")

changed = sum(1 for a, b in zip(pure_cbf_results, hybrid_results)
              if a["job_id"] != b["job_id"])
print(f"\n  Rank changes between CBF-only and Hybrid: {changed}/5")


# ---------------------------------------------------------------------------
# Summary table
# ---------------------------------------------------------------------------
print(f"\n{SEP}")
print("  SUMMARY TABLE")
print(SEP)

# Collect a varied sample: temp user, top user, a mid-range user (≈5 interactions)
mid_uid = interaction_counts[interaction_counts.between(4, 7)].index[0] \
    if not interaction_counts[interaction_counts.between(4, 7)].empty else \
    interaction_counts.index[len(interaction_counts)//2]
mid_count    = int(interaction_counts.get(mid_uid, 0))
alpha_mid, beta_mid = recommender._dynamic_weights(mid_uid)
mid_results  = recommender.recommend(user_id=mid_uid, n=5)

zero_uid = interaction_counts[interaction_counts == 0].index[0] \
    if not interaction_counts[interaction_counts == 0].empty else None

summary_rows = [
    ("TEST_CBF",  alpha_cbf,  beta_cbf,  0,          t1_results),
    (mid_uid,     alpha_mid,  beta_mid,  mid_count,   mid_results),
    (top_uid,     alpha_t2,   beta_t2,   top_count,   hybrid_results),
]

print(f"\n  {'User ID':<12} {'α':>6} {'β':>6} {'Interactions':>14}  Top 3 Recommended Jobs")
print(f"  {'-'*12} {'-'*6} {'-'*6} {'-'*14}  {'-'*55}")
for uid, a, b, cnt, results in summary_rows:
    top3 = "  |  ".join(r["job_title"][:18] for r in results[:3])
    print(f"  {uid:<12} {a:>6.4f} {b:>6.4f} {cnt:>14,}  {top3}")

print(f"\n{SEP}")
print("  All tests completed successfully.")
print(SEP)