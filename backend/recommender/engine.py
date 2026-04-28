"""
Hybrid Job Recommender Engine
==============================
Combines Content-Based Filtering (TF-IDF + Cosine Similarity) and
Collaborative Filtering (User-Item matrix + Cosine Similarity neighbours).

  S_Hybrid = α · S_CBF + β · S_CF

Dynamic weights:
  - Interaction count is a weighted tally: viewed=0.5, applied=1.0
  - Below MIN_INTERACTIONS: α=1.0, β=0.0  (pure CBF)
  - Above threshold: weights shift toward CF, capped at MAX_CF_BETA.
"""

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


MIN_INTERACTIONS = 1    # weighted tally before CF starts contributing
MAX_CF_BETA = 0.6
MIN_CBF_ALPHA = 0.4


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
        title = str(row.get("job_title", ""))
        experience = str(row.get("experience", ""))
        # repeat title and skills to boost their TF-IDF weight relative to description
        return f"{title} {title} {skills} {skills} {experience}".lower()

    @staticmethod
    def _user_text(row: pd.Series) -> str:
        title = str(row.get("current_title", ""))
        edu = str(row.get("education", ""))
        skills = str(row.get("skills", "")).replace(";", " ")
        exp_years = int(row.get("experience_years", 0) or 0)
        level = "senior" if exp_years >= 5 else "mid" if exp_years >= 2 else "junior"
        # repeat title and skills to match the emphasis in job text
        return f"{title} {title} {level} {edu} {skills} {skills}".lower()


class CollaborativeFilter:
    _TOP_K = 10

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
        # Cosine similarity is far more reliable than Pearson for sparse binary data.
        target_arr = target.values.reshape(1, -1)
        similarities: list[tuple[str, float]] = []
        for uid in self._matrix.index:
            if uid == user_id:
                continue
            other_arr = self._matrix.loc[uid].values.reshape(1, -1)
            sim = float(cosine_similarity(target_arr, other_arr)[0][0])
            if sim > 0:
                similarities.append((uid, sim))
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[: self._TOP_K]


class HybridRecommender:
    """
    Weighted hybrid recommender. The TF-IDF matrix is built once at startup.
    CF scores are computed on-demand from live JobInteraction rows.
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
            {"current_title": "", "education": "", "skills": "", "experience_years": 0}
        )
        cbf_scores = self._cbf.score(user_row)

        cf_scores: dict[str, float] = {}
        if beta > 0 and db_user is not None:
            cf_scores = self._cf_scores_for_db_user(db_user, user_id)

        user_skills_lower = {
            s.strip().lower()
            for s in str(user_row.get("skills", "")).split(";")
            if s.strip()
        }

        hybrid: list[tuple[str, float, float, float]] = []
        for job_id in self._job_df.index:
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

            driver, reason = self._label(cbf_pct, cf_pct, matched_skills, job_skills)

            results.append({
                "job_id": job_id,
                "job_title": str(job.get("job_title", "")),
                "company": str(job.get("company", "")),
                "location": str(job.get("location", "")),
                "required_skills": str(job.get("required_skills", "")),
                "match_score": round(score, 4),
                "cbf_pct": round(cbf_pct, 4),
                "cf_pct": round(cf_pct, 4),
                "apply_url": f"/jobs/{job_id}/apply",
                "recommendation_driver": driver,
                "recommendation_reason": reason,
            })
        return results

    # ------------------------------------------------------------------
    # Reason / driver labelling
    # ------------------------------------------------------------------

    @staticmethod
    def _label(cbf_pct: float, cf_pct: float, matched: list[str], job_skills: list[str]) -> tuple[str, str]:
        n_matched = len(matched)
        shown = ", ".join(matched[:3])

        if cbf_pct >= 0.7:
            driver = "skills_match"
            if matched:
                reason = f"{n_matched} matching skill{'s' if n_matched > 1 else ''}: {shown}"
            elif job_skills:
                # No exact profile skill matched — show what the role needs as context
                reason = f"Role requires: {', '.join(job_skills[:3])}"
            else:
                reason = "Profile aligned with role by title and experience"

        elif cf_pct >= 0.7:
            driver = "people_like_you"
            if matched:
                reason = f"Similar users applied — and your profile includes: {shown}"
            else:
                reason = "Professionals with a similar background engaged with this role"

        else:
            driver = "best_of_both"
            if matched:
                reason = f"{n_matched} skill match{'es' if n_matched > 1 else ''} ({shown}) · trending with similar users"
            else:
                reason = "Profile fit reinforced by similar users' activity"

        return driver, reason

    # ------------------------------------------------------------------
    # Weight calculation
    # ------------------------------------------------------------------

    def _dynamic_weights(self, user_id: str, db_user=None) -> tuple[float, float]:
        """
        Weighted tally: applied = 1.0 point, viewed = 0.5 points.
        This lets CF contribute once a user has viewed 2 jobs, rather than
        requiring 3 explicit applies (which almost never happens in a demo).
        """
        weighted_count = 0.0
        if db_user is not None:
            try:
                from accounts.models import JobInteraction
                for interaction in JobInteraction.objects.filter(user=db_user).values("interaction_type"):
                    if interaction["interaction_type"] == "applied":
                        weighted_count += 1.0
                    else:
                        weighted_count += 0.5
            except Exception:
                pass

        if weighted_count < MIN_INTERACTIONS:
            return 1.0, 0.0

        t = min(1.0, np.log1p(weighted_count - MIN_INTERACTIONS) / np.log1p(10))
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
                "experience_years": p.experience_years or 0,
            })
        except Exception:
            return pd.Series({"current_title": "", "education": "", "skills": "", "experience_years": 0})

    def _cf_scores_for_db_user(self, db_user, user_id: str) -> dict[str, float]:
        """Build a fresh CF matrix from all DB interactions and score the target user."""
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
