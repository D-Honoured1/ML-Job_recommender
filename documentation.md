# HJR-System — Hybrid Job Recommender System Documentation

---

## Table of Contents

1. [File Structure](#file-structure)
2. [Dataset Statistics](#dataset-statistics)
3. [System Architecture](#system-architecture)
4. [Algorithm Details](#algorithm-details)
5. [Weight Distribution](#weight-distribution)
6. [Evaluation Metrics](#evaluation-metrics)
7. [Sample Predictions](#sample-predictions)
8. [Performance](#performance)
9. [API Reference](#api-reference)

---

## File Structure

```
HJR-System/
├── frontend/                          # React 18 single-page application
│   ├── public/
│   │   └── index.html                 # HTML shell served to the browser
│   ├── src/
│   │   ├── App.jsx                    # Root component and routing setup
│   │   ├── index.jsx                  # ReactDOM entry point
│   │   └── pages/                     # Page-level components
│   ├── package.json                   # npm manifest; proxy → localhost:8000
│   └── package-lock.json              # Locked dependency tree
│
└── backend/                           # Django REST API + recommender engine
    ├── config/
    │   ├── settings.py                # Django settings (CORS, DRF, no DB)
    │   ├── urls.py                    # Root URL: /api/ → recommender.urls
    │   └── wsgi.py                    # WSGI entry point for production servers
    ├── data/
    │   ├── jobs.csv                   # 20 job listings with skills and descriptions
    │   ├── users.csv                  # 20 user profiles with skills and experience
    │   └── interactions.csv           # 100 binary user-job interaction records
    ├── recommender/
    │   ├── apps.py                    # AppConfig: loads CSVs and builds engine on startup
    │   ├── engine.py                  # Core ML logic: CBF, CF, HybridRecommender
    │   ├── views.py                   # RecommendationsView — GET /api/recommendations/
    │   ├── serializers.py             # DRF serializer for JobRecommendation output
    │   └── urls.py                    # App-level URL: recommendations/ → view
    ├── manage.py                      # Django management CLI
    └── requirements.txt               # Python dependencies (Django, sklearn, scipy…)
```

---

## Dataset Statistics

| Metric | Value |
|---|---|
| Total jobs | 20 |
| Total users | 20 |
| Total interactions | 100 |
| Positive interactions (interest = 1) | 61 (61%) |
| Negative interactions (interest = 0) | 39 (39%) |
| Matrix density | 25.0% |
| Interactions per user (min / max / mean) | 5 / 5 / 5.00 |
| Positive interactions per user (min / max / mean) | 3 / 4 / 3.05 |

### Jobs (`data/jobs.csv`)

Columns: `job_id`, `job_title`, `company`, `location`, `required_skills`, `description`

Locations covered: Lagos, Remote, Abuja, Port Harcourt

Job IDs: J001 – J020

### Users (`data/users.csv`)

Columns: `user_id`, `current_title`, `education`, `skills`, `experience`

Education levels: BSc, MSc, PhD, MBA, BA

Experience range: 1 – 8 years

User IDs: U001 – U020

### Interactions (`data/interactions.csv`)

Columns: `user_id`, `job_id`, `interaction`

`interaction` is binary: `1` = positive signal (applied / interested), `0` = negative signal (skipped)

---

## System Architecture

```
Django Startup
    └─ apps.RecommenderConfig.ready()
           ├─ Load jobs.csv, users.csv, interactions.csv
           └─ build_engine() → HybridRecommender singleton

HTTP Request
    └─ GET /api/recommendations/?user_id=U001&n=5
           └─ RecommendationsView.get()
                  └─ get_recommender().recommend(user_id, n)
                         ├─ _dynamic_weights(user_id) → (α, β)
                         ├─ ContentBasedFilter.score(user_row) → {job_id: cbf_score}
                         ├─ CollaborativeFilter.score(user_id)  → {job_id: cf_score}
                         ├─ hybrid[j] = α × cbf[j] + β × cf[j]
                         └─ return top-n sorted by hybrid score
```

The engine is initialized once at server startup and held in memory. There is no database — all data lives in-memory as pandas DataFrames.

---

## Algorithm Details

### Content-Based Filtering (CBF)

Represents each job and user as a TF-IDF vector, then scores jobs by cosine similarity to the user's profile.

**Job text** = `job_title` + `required_skills` + `description`  
**User text** = `current_title` + `education` + `skills`

TF-IDF configuration:

| Parameter | Value |
|---|---|
| analyzer | word |
| ngram_range | (1, 2) — unigrams + bigrams |
| min_df | 1 |
| stop_words | english |
| sublinear_tf | True |

Score range: [0, 1]

### Collaborative Filtering (CF)

User-based CF using Pearson correlation. For each target user, finds the top-5 most similar users (neighbours) and computes a weighted average of their interaction values.

**Similarity:** Pearson correlation over shared interactions (minimum 2 shared items required)  
**Prediction:** `S_CF(u, j) = Σ[sim(u,v) × r(v,j)] / Σ|sim(u,v)|` over top-K neighbours  
**Top-K neighbours:** 5

Score range: [0, 1]

### Hybrid Scoring

```
S_Hybrid = α × S_CBF + β × S_CF       (α + β = 1)
```

Weights are computed dynamically per user based on their positive interaction count:

```
count  < 3:  α = 1.000,  β = 0.000   (pure CBF — cold start)
count >= 3:  t = min(1.0, log(count − 3) / log(11))
             α = 1.0 − t × 0.7        (range: [0.30, 1.00])
             β = t × 0.7              (range: [0.00, 0.70])
```

This log-scaled ramp lets CBF dominate early on and gradually shifts toward CF as the user accumulates more interaction history.

---

## Weight Distribution

Weights are based on each user's **positive** interaction count (interactions where `interaction = 1`).

| User | Alpha (α) | Beta (β) | Positive Interactions | Strategy |
|---|---|---|---|---|
| U001 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U002 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U003 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U004 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U005 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U006 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U007 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U008 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U009 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U010 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U011 | 0.7977 | 0.2023 | 4 | CBF-dominant Hybrid |
| U012 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U013 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U014 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U015 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U016 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U017 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U018 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U019 | 1.0000 | 0.0000 | 3 | Pure CBF |
| U020 | 1.0000 | 0.0000 | 3 | Pure CBF |

> **Note:** With the current dataset, 19 out of 20 users sit at exactly the minimum threshold (3 positive interactions), so the system operates in pure CBF mode for them. U011 is the only user whose extra interaction triggers a partial CF contribution (α=0.798, β=0.202). The CF component will grow in influence as users accumulate more history.

---

## Evaluation Metrics

Evaluated using **top-10 recommendations** for all 20 users against their known positive interactions.

| Engine | Precision@10 | Recall@10 | F1 Score |
|---|---|---|---|
| Content-Based Filtering (CBF) | 0.2850 | 0.9333 | 0.4367 |
| Collaborative Filtering (CF) | 0.1750 | 0.5750 | 0.2683 |
| **Hybrid (current)** | **0.2850** | **0.9333** | **0.4367** |

**Interpretation:**

- The Hybrid and CBF scores are identical because almost all users are in pure-CBF mode (see Weight Distribution above). As users accumulate more interactions, the hybrid engine will begin to diverge from CBF and is expected to improve.
- Recall@10 of 0.93 means the engine surfaces ~93% of a user's known positive jobs within the top-10 results — strong coverage given the small catalogue (20 jobs).
- Precision@10 of 0.285 means roughly 3 out of every 10 returned jobs are positively matched — reasonable for a 20-job catalogue where many jobs are unrelated to any given user.
- CF underperforms CBF at this dataset size because the sparse interaction matrix (25% density, min 5 interactions per user) does not provide enough signal for reliable neighbour-finding via Pearson correlation.

---

## Sample Predictions

### U001 — Junior Software Engineer (Python, Django, REST APIs, Git | 2 years | Lagos)

| Rank | Job ID | Job Title | Company | Location | Match Score |
|---|---|---|---|---|---|
| 1 | J001 | Software Engineer | TechCorp | Lagos | 0.5872 |
| 2 | J007 | Full Stack Developer | NexGen | Lagos | 0.1999 |
| 3 | J011 | Android Developer | MobileTech | Remote | 0.1320 |
| 4 | J012 | iOS Developer | AppCraft | Lagos | 0.0860 |
| 5 | J004 | Backend Developer | CloudBase | Lagos | 0.0816 |

Weights used: α = 1.0000, β = 0.0000 (pure CBF)

### U011 — AI Research Scientist (Python, PyTorch, Deep Learning, NLP, Research | 7 years | PhD ML)

| Rank | Job ID | Job Title | Company | Location | Match Score |
|---|---|---|---|---|---|
| 1 | J018 | AI Research Scientist | DeepMind Africa | Lagos | 0.4138 |
| 2 | J006 | Machine Learning Engineer | AI Labs | Port Harcourt | 0.3096 |
| 3 | J002 | Data Scientist | DataWave | Remote | 0.1869 |
| 4 | J020 | UI/UX Designer | DesignLab | Remote | 0.0661 |
| 5 | J013 | NLP Engineer | LinguaTech | Remote | 0.0647 |

Weights used: α = 0.7977, β = 0.2023 (CBF-dominant hybrid)

---

## Performance

| Metric | Value |
|---|---|
| Engine startup time | ~11,560 ms (cold start, includes library loading) |
| Average API response time | 17.80 ms |
| Minimum API response time | 3.30 ms |
| Maximum API response time | 153.08 ms |

Startup time is a one-time cost incurred when Django initialises the `RecommenderConfig.ready()` hook. Response latency is dominated by the Pearson correlation computation in the CF component, which is why users with more neighbours (like U011) take longer to serve.

---

## API Reference

### `GET /api/recommendations/`

Returns a ranked list of job recommendations for a given user.

**Query Parameters**

| Parameter | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `user_id` | string | Yes | — | Must match a user in `users.csv` |
| `n` | integer | No | 10 | Clamped to [1, 50] |

**Example Request**

```
GET /api/recommendations/?user_id=U001&n=5
```

**Example Response (200 OK)**

```json
{
  "user_id": "U001",
  "weights": {
    "alpha": 1.0,
    "beta": 0.0
  },
  "count": 5,
  "recommendations": [
    {
      "job_id": "J001",
      "job_title": "Software Engineer",
      "company": "TechCorp",
      "location": "Lagos",
      "required_skills": "Python;Django;REST APIs",
      "match_score": 0.5872,
      "apply_url": "/jobs/J001/apply"
    }
  ]
}
```

**Error Responses**

| Status | Condition |
|---|---|
| 400 Bad Request | `user_id` missing or `n` is not a valid integer |
| 503 Service Unavailable | Engine failed to initialise at startup |