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

</div>

---

## Overview

gigHood is a 7-layer parametric claim decision platform for quick-commerce workers. It detects zone disruption (DCI), validates claim safety signals, and routes approved payouts automatically.

## Documentation Map

| Markdown File | Purpose |
|:--|:--|
| `README.md` | Canonical project overview, structure, setup, and runbook |
| `API.md` | Backend route contracts and payloads |
| `DATABASE.md` | Schema + migration-backed field definitions |
| `AGENTS.md` | Repo conventions, guardrails, and validation checklist |
| `SOLUTION.md` | Full narrative and deep-dive technical writeup |

## Project Structure

```text
gigHood/
	backend/
		api/
		services/
		scheduler/
		tests/
	frontend/
		src/
			app/
			components/
			lib/
			store/
	supabase/
		migrations/
	scripts/
	tests/
	README.md
	API.md
	DATABASE.md
	AGENTS.md
	SOLUTION.md
```

## Local Setup

### Prerequisites

1. Python 3.11+
2. Node.js 20+
3. npm 10+
4. Docker Desktop (optional)

### Script Workflow (Recommended)

1. Clone and enter repo:

```bash
cd /Users/apple/Documents/Projects/gigHood
```

2. Bootstrap dependencies:

```bash
chmod +x setup.sh
./setup.sh
```

3. Configure `backend/.env` with required keys:

1. `SUPABASE_URL`
2. `SUPABASE_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `JWT_SECRET`
5. `RAZORPAY_KEY_ID`
6. `RAZORPAY_KEY_SECRET`
7. `OPENROUTER_API_KEY`
8. `GROQ_API_KEY`
9. `FIREBASE_CREDENTIALS_PATH` or JSON-based secret

4. Start backend:

```bash
source venv/bin/activate
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8001
```

5. Start frontend in a new terminal:

```bash
cd /Users/apple/Documents/Projects/gigHood/frontend
npm ci
npm run dev
```

6. Access apps:

1. Frontend: `http://localhost:3000`
2. Backend OpenAPI: `http://127.0.0.1:8001/docs`

### Docker Workflow

1. Ensure `backend/.env` is configured.
2. Run:

```bash
docker compose up --build -d
```

3. Stop:

```bash
docker compose down
```

## Routes

1. Landing: `/`
2. Worker login: `/worker-app/login`
3. Worker register: `/worker-app/register`
4. Worker home: `/worker-app/home`
5. Worker chat: `/worker-app/chat`
6. Worker payouts: `/worker-app/payouts`
7. Worker profile: `/worker-app/profile`
8. Admin dashboard: `/admin-dashboard`

## Maintenance Notes

1. Keep database changes migration-first in `supabase/migrations/`.
2. Keep docs synchronized with code when routes/schema change.
3. Avoid adding non-project technologies in website tech stack copy.

