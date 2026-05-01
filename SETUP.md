# HJR-System — Setup Guide

Follow these steps on any new machine to get the project running.

---

## Prerequisites

Install the following before starting:

- **Python 3.10+** — https://www.python.org/downloads/
- **Node.js 18+** — https://nodejs.org/
- **PostgreSQL 14+** — https://www.postgresql.org/download/

Verify they are installed:

```bash
python3 --version
node --version
psql --version
```

---

## Step 1 — Copy the Project

Transfer the entire `Skai/` folder to the new machine.

> **Important:** Do **not** copy the `backend/.venv/` folder — it is compiled for the
> source machine's OS and Python version and will not work elsewhere. You will
> create a fresh one in Step 3.

All CSV job data is included in `backend/data/` and will work immediately.

---

## Step 2 — Create the Database

Open a terminal and run:

```bash
psql -U postgres
```

Then inside the psql prompt:

```sql
CREATE USER skai_user WITH PASSWORD 'skai1234';
CREATE DATABASE skai_db OWNER skai_user;
\q
```

---

## Step 3 — Set Up the Python Environment

```bash
cd Skai/backend

python3 -m venv .venv

source .venv/bin/activate
# Windows: .venv\Scripts\activate

pip install -r requirements.txt
```

---

## Step 4 — Run Database Migrations

```bash
python manage.py migrate
```

You should see all migrations listed with `OK` next to each one.

---

## Step 5 — Load Job Data

This populates the database from the included CSV file. Run it once:

```bash
python manage.py load_jobs
```

You should see a confirmation that jobs were loaded (e.g. `Loaded 2500 jobs`).

---

## Step 6 — Start the Backend

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

---

## Step 7 — Set Up the Frontend

Open a **new terminal** (keep the backend terminal running):

```bash
cd Skai/frontend

npm install
```

---

## Step 8 — Start the Frontend

```bash
npm start
```

The app will open at `http://localhost:3000`.

---

## Step 9 — Verify It Works

1. Open `http://localhost:3000` in your browser
2. Click **Create account** and register with your details
3. Your personalised job recommendations will load automatically
4. Use the search bar to search all 2,500 jobs by title, company, location, or skills

---

## Notes

- The backend must be running on port **8000** before starting the frontend
- Both terminals must stay open while using the app
- Uploaded resume files (if any) are stored in `backend/media/resumes/` — copy that
  folder from the old machine if you need to preserve them
- Database credentials (`skai_user` / `skai1234`) are the default values baked into
  `backend/config/settings.py` — they can be overridden with the environment variables
  `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT` if your PostgreSQL setup differs
