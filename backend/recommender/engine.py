"""
Hybrid Job Recommender Engine
==============================
Combines Content-Based Filtering (TF-IDF + Cosine Similarity) and
Collaborative Filtering (User-Item matrix + Pearson Correlation).

  S_Hybrid = α · S_CBF + β · S_CF

All data is loaded from PostgreSQL — no CSV files at runtime.

Dynamic weights:
  - New users (< MIN_INTERACTIONS applied interactions): α=1.0, β=0.0 (pure CBF)
  - Experienced users: weights shift toward CF as interaction count grows,
    capped at α=0.3, β=0.7.
"""

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from scipy.stats import pearsonr


MIN_INTERACTIONS = 3
MAX_CF_BETA = 0.7
MIN_CBF_ALPHA = 0.3


class ContentBasedFilter:
    def __init__(self) -> None:
        self._vectorizer: TfidfVectorizer | None = None
        self._job_matrix = None
        self._job_ids: list[str] = []

    def fit(self, job_df: pd.DataFrame) -> None:
        self._job_ids = job_df["job_id"].tolist()
        corpus = job_df.apply(self._job_text, axis=1).tolist()
        self._vectorizer = TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 2),
            min_df=1,
            stop_words="english",
            sublinear_tf=True,
        )
        self._job_matrix = self._vectorizer.fit_transform(corpus)

    def score(self, user_row: pd.Series) -> dict[str, float]:
        if self._vectorizer is None:
            raise RuntimeError("ContentBasedFilter has not been fitted yet.")
        user_vec = self._vectorizer.transform([self._user_text(user_row)])
        sims = cosine_similarity(user_vec, self._job_matrix).flatten()
        return dict(zip(self._job_ids, sims.tolist()))

    @staticmethod
    def _job_text(row: pd.Series) -> str:
        skills = str(row.get("required_skills", "")).replace(";", " ")
        desc = str(row.get("description", ""))
        title = str(row.get("job_title", ""))
        return f"{title} {skills} {desc}".lower()

    @staticmethod
    def _user_text(row: pd.Series) -> str:
        title = str(row.get("current_title", ""))
        edu = str(row.get("education", ""))
        skills = str(row.get("skills", "")).replace(";", " ")
        return f"{title} {edu} {skills}".lower()


class CollaborativeFilter:
    _TOP_K = 5

    def __init__(self) -> None:
        self._matrix: pd.DataFrame | None = None

    def fit(self, interaction_df: pd.DataFrame) -> None:
        self._matrix = interaction_df.pivot_table(
            index="user_id",
            columns="job_id",
            values="interaction",
            fill_value=0,
        ).astype(float)

    def score(self, user_id: str) -> dict[str, float]:
        if self._matrix is None or user_id not in self._matrix.index:
            return {}

        target = self._matrix.loc[user_id]
        neighbours = self._find_neighbours(user_id, target)
        if not neighbours:
            return {}

        scores: dict[str, float] = {}
        for job_id in self._matrix.columns:
            relevant = [
                (sim, self._matrix.loc[uid, job_id])
                for uid, sim in neighbours
                if self._matrix.loc[uid, job_id] > 0
            ]
            if not relevant:
                scores[job_id] = 0.0
                continue
            sims_arr = np.array([s for s, _ in relevant])
            ratings_arr = np.array([r for _, r in relevant])
            denom = np.abs(sims_arr).sum()
            scores[job_id] = float((sims_arr * ratings_arr).sum() / denom) if denom else 0.0

        return {k: max(0.0, min(1.0, v)) for k, v in scores.items()}

    def _find_neighbours(self, user_id: str, target: pd.Series) -> list[tuple[str, float]]:
        correlations: list[tuple[str, float]] = []
        for uid in self._matrix.index:
            if uid == user_id:
                continue
            other = self._matrix.loc[uid]
            shared_mask = (target > 0) | (other > 0)
            if shared_mask.sum() < 2:
                continue
            t_vals = target[shared_mask].values
            o_vals = other[shared_mask].values
            if t_vals.std() == 0 or o_vals.std() == 0:
                continue
            try:
                corr, _ = pearsonr(t_vals, o_vals)
            except Exception:
                continue
            if not np.isnan(corr):
                correlations.append((uid, float(corr)))
        correlations.sort(key=lambda x: x[1], reverse=True)
        return correlations[: self._TOP_K]


class HybridRecommender:
    """
    Weighted hybrid recommender. Jobs are pre-loaded from the DB into memory
    (TF-IDF matrix built at startup). CF scores are computed on-demand from
    live JobInteraction rows.
    """

    def __init__(self, job_df: pd.DataFrame) -> None:
        self._job_df = job_df.set_index("job_id")
        self._cbf = ContentBasedFilter()
        self._cbf.fit(job_df)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def recommend(self, user_id: str, n: int = 10, db_user=None) -> list[dict]:
        alpha, beta = self._dynamic_weights(user_id, db_user=db_user)

        user_row = self._profile_to_series(db_user) if db_user is not None else pd.Series(
            {"current_title": "", "education": "", "skills": ""}
        )
        cbf_scores = self._cbf.score(user_row)

        cf_scores: dict[str, float] = {}
        if beta > 0 and db_user is not None:
            cf_scores = self._cf_scores_for_db_user(db_user, user_id)

        user_skills = [s.strip() for s in str(user_row.get("skills", "")).split(";") if s.strip()]
        user_skills_lower = {s.lower() for s in user_skills}

        all_job_ids = self._job_df.index.tolist()
        hybrid: list[tuple[str, float, float, float]] = []
        for job_id in all_job_ids:
            cbf_s = cbf_scores.get(job_id, 0.0)
            cf_s = cf_scores.get(job_id, 0.0)
            hybrid.append((job_id, alpha * cbf_s + beta * cf_s, cbf_s, cf_s))

        hybrid.sort(key=lambda x: x[1], reverse=True)

        results = []
        for job_id, score, cbf_s, cf_s in hybrid[:n]:
            if job_id not in self._job_df.index:
                continue
            job = self._job_df.loc[job_id]

            cbf_contrib = alpha * cbf_s
            cf_contrib = beta * cf_s
            total = cbf_contrib + cf_contrib
            if total > 0:
                cbf_pct = cbf_contrib / total
                cf_pct = cf_contrib / total
            else:
                cbf_pct, cf_pct = 1.0, 0.0

            job_skills = [s.strip() for s in str(job.get("required_skills", "")).split(";") if s.strip()]
            matched_skills = [s for s in job_skills if s.lower() in user_skills_lower]

            if cbf_pct > 0.7:
                driver = "skills_match"
                if matched_skills:
                    reason = f"Your {', '.join(matched_skills[:3])} skills match this role"
                else:
                    reason = "Your profile is a strong fit for this role"
            elif cf_pct > 0.7:
                driver = "people_like_you"
                reason = "People with your background also applied to this"
            else:
                driver = "best_of_both"
                if matched_skills:
                    reason = f"Skills match ({', '.join(matched_skills[:2])}) and popular with similar users"
                else:
                    reason = "Strong profile fit and popular with similar users"

            results.append({
                "job_id": job_id,
                "job_title": str(job.get("job_title", "")),
                "company": str(job.get("company", "")),
                "location": str(job.get("location", "")),
                "required_skills": str(job.get("required_skills", "")),
                "match_score": round(score, 4),
                "apply_url": f"/jobs/{job_id}/apply",
                "recommendation_driver": driver,
                "recommendation_reason": reason,
            })
        return results

    # ------------------------------------------------------------------
    # Weight calculation
    # ------------------------------------------------------------------

    def _dynamic_weights(self, user_id: str, db_user=None) -> tuple[float, float]:
        count = 0
        if db_user is not None:
            try:
                from accounts.models import JobInteraction
                count = JobInteraction.objects.filter(
                    user=db_user, interaction_type="applied"
                ).count()
            except Exception:
                count = 0

        if count < MIN_INTERACTIONS:
            return 1.0, 0.0

        t = min(1.0, np.log1p(count - MIN_INTERACTIONS) / np.log1p(10))
        alpha = 1.0 - t * (1.0 - MIN_CBF_ALPHA)
        beta = t * MAX_CF_BETA
        return round(alpha, 4), round(beta, 4)

    # ------------------------------------------------------------------
    # DB user helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _profile_to_series(db_user) -> pd.Series:
        try:
            p = db_user.profile
            return pd.Series({
                "current_title": p.current_title or "",
                "education": p.education or "",
                "skills": p.skills or "",
            })
        except Exception:
            return pd.Series({"current_title": "", "education": "", "skills": ""})

    def _cf_scores_for_db_user(self, db_user, user_id: str) -> dict[str, float]:
        """Build CF matrix from all DB interactions and score the target user."""
        try:
            from accounts.models import JobInteraction

            all_interactions = list(
                JobInteraction.objects.values("user_id", "job_id", "interaction_type")
            )
            if not all_interactions:
                return {}

            rows = [
                {
                    "user_id": f"db_{r['user_id']}",
                    "job_id": r["job_id"],
                    "interaction": 1.0 if r["interaction_type"] == "applied" else 0.5,
                }
                for r in all_interactions
            ]
            df = pd.DataFrame(rows).drop_duplicates(subset=["user_id", "job_id"], keep="last")

            temp_cf = CollaborativeFilter()
            temp_cf.fit(df)
            return temp_cf.score(user_id)
        except Exception:
            return {}


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
_recommender: HybridRecommender | None = None


def build_engine(job_df: pd.DataFrame) -> None:
    global _recommender
    _recommender = HybridRecommender(job_df)


def get_recommender() -> HybridRecommender:
    if _recommender is None:
        raise RuntimeError(
            "HybridRecommender has not been initialised. "
            "Ensure the Job table is populated (run load_jobs) before starting the server."
        )
    return _recommender