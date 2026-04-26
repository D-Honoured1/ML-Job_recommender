# HJR-System — Setup Guide

Follow these steps on the new machine to get the project running.

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

Transfer the entire `Skai/` folder to the new machine. All CSV data files are
included inside `backend/data/` and will work immediately.

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
pip install psycopg2-binary
```

---

## Step 4 — Run Database Migrations

```bash
python manage.py migrate
```

You should see a list of migrations applied with `OK` next to each one.

---

## Step 5 — Start the Backend

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

---

## Step 6 — Set Up the Frontend

Open a new terminal:

```bash
cd Skai/frontend

npm install
```

---

## Step 7 — Start the Frontend

```bash
npm start
```

The app will open at `http://localhost:3000`

---

## Step 8 — Verify It Works

1. Open `http://localhost:3000` in your browser
2. Type `U001` in the User ID field and click **Recommend**
3. You should see a grid of job cards — the engine is working
4. Click **Register** to create an account and test authenticated recommendations

---

## Notes

- The backend must be running on port **8000** before starting the frontend
- Both terminals must stay open while using the app
- Uploaded resume files (if any) are stored in `backend/media/resumes/` — copy that folder from the old machine if you need to preserve them