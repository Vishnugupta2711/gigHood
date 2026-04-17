<div align="center">
  <img src="./frontend/public/logo.jpeg" alt="gigHood logo" width="120" />
</div>

<div align="center">

# gigHood

### AI-Powered Parametric Income Insurance for Gig Workers

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Data%20Layer-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-Frontend-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-UI-61DAFB?style=for-the-badge&logo=react&logoColor=0B1220)
![TypeScript](https://img.shields.io/badge/TypeScript-App%20Code-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-State-7D4CDB?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Local%20Infra-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Frontend%20Hosting-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-Backend%20Hosting-46E3B7?style=for-the-badge&logo=render&logoColor=0B1220)
![APScheduler](https://img.shields.io/badge/APScheduler-Background%20Jobs-0F172A?style=for-the-badge)
![Razorpay](https://img.shields.io/badge/Razorpay-Payouts-0C2451?style=for-the-badge&logo=razorpay&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Notifications-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![OpenRouter](https://img.shields.io/badge/OpenRouter-LLM%20Gateway-111827?style=for-the-badge)
![Groq](https://img.shields.io/badge/Groq-Inference-F55036?style=for-the-badge)

> **[🚀 Jump to Setup Instructions](#prerequisites)** | **[📖 Read the Full Solution & Architecture](./docs/SOLUTION.md)**

</div>

## What is gigHood?

**gigHood** is an AI-powered parametric income insurance platform for Q-commerce delivery partners (Zepto, Blinkit). It detects zone-level economic disruptions (weather, AQI, curfews) and automatically triggers instant payouts to affected workers—with zero paperwork or claim filing required.

**For a deep dive into the Actuarial Mechanics, Machine Learning Architecture, Fraud Defense, and Unit Economics, please see our detailed [SOLUTION.md](./docs/SOLUTION.md).**

## Documentation Index

1. `docs/SOLUTION.md`: The complete product, actuarial, and architecture narrative (Round 2 requirement).
2. `docs/API.md`: Backend routes and endpoint contracts.
3. `docs/DATABASE.md`: Schema, entity relationships, and Neo4j projection map.
4. `docs/CONTEXT.md`: Deployment, operational guidelines, and system topology.
5. `AGENTS.md`: Coding/contribution guardrails.

## Repository Structure

```text
gigHood/
├── backend/          # FastAPI backend, ML models, spatial intelligence
├── frontend/         # Next.js 14 Web App (Worker App & Admin Dashboard)
├── supabase/         # PostgreSQL migrations & DB schema
├── dataset/          # Synthetic training data for XGBoost models
├── docs/             # Technical and product documentation
├── tests/            # Pytest test suites
├── docker-compose.yml
└── README.md
```

## Prerequisites

1. Python 3.11+
2. Node.js 20+
3. npm 10+
4. Docker Desktop (optional for full stack run)

## Quick Setup

### macOS/Linux

```bash
chmod +x setup.sh
./setup.sh
```

### Windows

```bat
setup.bat
```

## Environment Variables

Use example files to bootstrap local setup:

1. `cp backend/.env.example backend/.env`
2. `cp frontend/.env.example frontend/.env.local`

**Important Backend Env Vars (`backend/.env`):**
- `SUPABASE_URL` & `SUPABASE_KEY` & `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`
- `NEO4J_URI` & `NEO4J_USER` & `NEO4J_PASSWORD`
- `OPENWEATHER_API_KEY` & `CPCB_API_KEY`
- `GROQ_API_KEY` & `OPENROUTER_API_KEY`

**Important Frontend Env Vars (`frontend/.env.local`):**
- `NEXT_PUBLIC_API_URL` (typically `http://127.0.0.1:8001` for local dev)

## Run Locally

### Backend

```bash
# one-time setup (if venv is missing)
python3.11 -m venv venv

source venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8001
```

### Frontend

```bash
cd frontend
npm ci 
npm run dev
```

## Docker

To run the entire stack (Frontend + Backend + DB dependencies) via Docker:

```bash
docker compose up --build -d
```

Stop the containers:

```bash
docker compose down
```

## Local URLs

1. Frontend App & Admin Dashboard: `http://localhost:3000`
2. Backend API: `http://127.0.0.1:8001`
3. OpenAPI / Swagger Docs: `http://127.0.0.1:8001/docs`

## Validation Commands

To ensure system integrity, run tests from the repository root:

```bash
source venv/bin/activate && PYTHONPATH=. pytest
```

To validate the frontend build:

```bash
cd frontend
npm run lint
npm run build
```

## Python Runtime Pinning

- This branch intentionally includes root `.python-version` set to `3.11.9`.
- Render backend deploys in this repo require root `.python-version` pinned to `3.11.9` to avoid Python 3.14 package build failures. Do not modify or remove this file.

## UI Surface Contract

1. Worker routes (`/worker-app/*` and supported legacy aliases) render in a dark, mobile-focused shell.
2. Admin and public routes (`/admin-dashboard/*`) remain light and full-width desktop layouts.
3. Route-scoped wrapper for this behavior lives in `frontend/src/components/AppRouteShell.tsx`.

## Notes

- **Demo Simulations:** Disruption simulation endpoints are available under `/workers/me/demo/*` to safely test trigger logic locally without waiting for real-world environmental collapse.