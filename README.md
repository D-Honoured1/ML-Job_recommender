# Hybrid Job Recommender

A full-stack job recommendation system that blends **Content-Based Filtering (CBF)** and **Collaborative Filtering (CF)** into a weighted hybrid model. The system personalises recommendations using a user's profile skills and the behaviour of similar users, with weights that shift dynamically as the user engages with the platform.

---

## How it works

### Hybrid algorithm

```
S_Hybrid = α · S_CBF  +  β · S_CF
```

| Signal | Method | Input |
|--------|--------|-------|
| **CBF** | TF-IDF + Cosine Similarity | User profile (title, skills, education) vs job corpus |
| **CF** | User-based Pearson Correlation | JobInteraction table — which jobs similar users applied to |

### Dynamic weights

| Interactions (applied) | α (CBF) | β (CF) | Mode |
|------------------------|---------|--------|------|
| < 3 | 1.0 | 0.0 | Pure profile matching |
| 3 → 13+ | 1.0 → 0.3 | 0.0 → 0.7 | Gradually shifts toward community signals |

### Recommendation drivers

Every job card is labelled with the signal that drove it:

- **Skills Match** (blue) — CBF contributed > 70% of the score
- **People Like You** (green) — CF contributed > 70% of the score
- **Best of Both** (purple) — both signals contributed roughly equally

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, Axios |
| Backend | Django 4.2, Django REST Framework, SimpleJWT |
| Database | PostgreSQL |
| ML | scikit-learn (TF-IDF), scipy (Pearson correlation), pandas, NumPy |
| Production | Gunicorn, WhiteNoise, Railway |

---

## Project structure

```
Skai/
├── backend/
│   ├── accounts/            # Auth, UserProfile, JobInteraction models
│   ├── recommender/
│   │   ├── engine.py        # HybridRecommender (CBF + CF)
│   │   ├── models.py        # Job model
│   │   ├── views.py         # GET /api/recommendations/
│   │   ├── serializers.py
│   │   └── management/
│   │       └── commands/
│   │           └── load_jobs.py   # Loads IT_jobs.csv → PostgreSQL
│   ├── config/              # Django settings, URLs, WSGI
│   ├── data/
│   │   └── IT_jobs.csv      # Source data (2500 IT jobs from Kaggle)
│   ├── Procfile
│   ├── railway.json
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── RecommendationsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── api.js           # Axios client with JWT refresh interceptor
│   │   └── App.jsx
│   ├── railway.json
│   └── .env.example
└── README.md
```

---

## Local setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### 1. Database

```bash
psql -U postgres
```

```sql
CREATE USER skai_user WITH PASSWORD 'skai1234';
CREATE DATABASE skai_db OWNER skai_user;
\q
```

### 2. Backend

```bash
cd Skai/backend

python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate
python manage.py load_jobs       # Loads 2500 jobs from data/IT_jobs.csv

python manage.py runserver
# → http://localhost:8000
```

### 3. Frontend

```bash
cd Skai/frontend
npm install
npm start
# → http://localhost:3000
```

The frontend proxies `/api/*` to `localhost:8000` in development.

---

## API reference

All endpoints are prefixed with `/api/`.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register/` | — | Register a new user |
| POST | `/auth/login/` | — | Login, returns JWT pair |
| POST | `/auth/logout/` | JWT | Blacklist refresh token |
| POST | `/auth/token/refresh/` | — | Refresh access token |
| GET | `/auth/profile/` | JWT | Get user profile |
| PUT | `/auth/profile/` | JWT | Update profile |
| POST | `/auth/profile/resume/` | JWT | Upload PDF resume (extracts skills) |

### Recommendations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/recommendations/?n=10` | JWT | Get top-n personalised job recommendations |

**Response shape:**

```json
{
  "user_id": "db_1",
  "weights": { "alpha": 1.0, "beta": 0.0 },
  "count": 10,
  "profile": {
    "username": "alice",
    "current_title": "Python Developer",
    "skills": "Python;Django;REST APIs"
  },
  "recommendations": [
    {
      "job_id": "J0620",
      "job_title": "Lead Software Engineer - Python",
      "company": "Acme Corp",
      "location": "London",
      "required_skills": "Python;Django;REST APIs;Git",
      "match_score": 0.3825,
      "apply_url": "/jobs/J0620/apply",
      "recommendation_driver": "skills_match",
      "recommendation_reason": "Matches your Python, Django, REST APIs skills"
    }
  ]
}
```

### Interactions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/jobs/interact/` | JWT | Record a viewed or applied interaction |

```json
{ "job_id": "J0620", "interaction_type": "viewed" }
```

---

## Deployment on Railway

The project is configured for deployment as two separate Railway services.

### Environment variables

**Backend service**

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | `openssl rand -base64 48` |
| `DATABASE_URL` | PostgreSQL URL (Railway injects automatically) | |
| `DJANGO_ENV` | Set to `production` to disable DEBUG | `production` |
| `ALLOWED_HOSTS` | Comma-separated allowed hostnames | `skai-backend.railway.app` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed frontend origins | `https://skai-frontend.railway.app` |

**Frontend service**

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Full URL of the backend service | `https://skai-backend.railway.app` |

### Deploy

1. Push the repo to GitHub.
2. Create a **PostgreSQL** plugin in Railway — the `DATABASE_URL` is injected automatically into the backend service.
3. Create a backend service pointing to the `backend/` directory. Railway uses `railway.json` to run:
   ```
   python manage.py migrate && python manage.py load_jobs && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
   ```
4. Create a frontend service pointing to the `frontend/` directory. Set `REACT_APP_API_URL` to the backend's Railway URL. Railway uses `railway.json` to run:
   ```
   npx serve -s build
   ```
5. Add all required environment variables to each service.

---

## Management commands

| Command | Description |
|---------|-------------|
| `python manage.py load_jobs` | Clear and reload the Job table from `data/IT_jobs.csv` |
| `python manage.py migrate` | Apply all database migrations |

---

## Data source

Jobs data: [IT Jobs Dataset on Kaggle](https://www.kaggle.com/) — 2500 IT job postings. The dataset is stored at `backend/data/IT_jobs.csv` and is the only CSV file used in the project. All other data (users, interactions, job records) lives in PostgreSQL at runtime.
