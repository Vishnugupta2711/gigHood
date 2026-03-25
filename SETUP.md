# gigHood — Developer Setup Guide

This guide covers everything you need to set up the gigHood backend, database, and infrastructure on your local machine. 

## Prerequisites
- **Python 3.11** (Required for spatial dependencies like `h3-py` and `shapely`)
- **Git**
- **Supabase Account** (Free tier is sufficient)

---

## 1. Local Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/gigHood.git
   cd gigHood
   ```

2. **Initialize Python Virtual Environment:**
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

---

## 2. Environment Variables & Credentials

1. **Create the `.env` file:**
   Copy the example template to create your local environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Populate the `.env` file:**
   Fill in all the required variables in `backend/.env`. You will need:
   - Supabase URLs and Keys (Anon, Service Role, Publishable, Secret)
   - OpenWeather API Key
   - CPCB API Key
   - Razorpay Sandbox Keys (Key ID, Secret)
   - OpenRouter / Groq API Keys 

3. **Firebase Credentials:**
   Place your Firebase Admin SDK service account JSON file in the `backend/` directory.
   Ensure it is named exactly `firebase-credentials.json` (as per `.env.example`).
   > **Note:** Do NOT commit this file to GitHub. It is already in `.gitignore`.

---

## 3. Database Initialization (Supabase)

gigHood uses a remote Supabase instance (PostgreSQL + PostGIS). 

1. Create a new Supabase project in the dashboard.
2. In the Supabase SQL editor, enable the PostGIS extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Copy the 11 sequential migration `.sql` scripts located in `supabase/migrations/` and execute them in order (from `000` to `010`) via the Supabase SQL Editor.
4. **Permissions Fix:** If you ran the schema wipe (`DROP SCHEMA public CASCADE`), ensure you grant the proper permissions back so your API keys can access the data:
   ```sql
   GRANT USAGE ON SCHEMA public TO anon, service_role;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, service_role;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
   ```

---

## 4. Run Smoke Tests & Seeding

Verify that your backend can communicate with your database:

1. **Database Smoke Test:**
   ```bash
   PYTHONPATH=$(pwd) python backend/db/smoke_test.py
   ```
   *Expected output: All 10 tables report successfully verified.*

2. **Run the Spatial Seeder:**
   To populate the `hex_zones` table for the primary testing city (Bengaluru), run:
   ```bash
   PYTHONPATH=$(pwd) python backend/scripts/seed_bengaluru.py
   ```
   *Expected output: "Successfully seeded hex_zones for Bengaluru!" (usually inserts ~7,600 rows).*

---

## 5. Starting the Server

Start the FastAPI application natively:

```bash
cd backend
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`. You can access the interactive Swagger UI at `http://127.0.0.1:8000/docs`.
