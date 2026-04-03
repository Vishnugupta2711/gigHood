# gigHood

AI-powered parametric income protection for gig workers.

## What This Repo Contains

1. A FastAPI backend for auth, DCI, policy issuance, claim routing, payouts, and chat.
2. A Next.js worker app for onboarding, dashboard, payouts, profile, and support flows.
3. Supabase migrations and runtime data contracts.

## Documentation Index

1. `README.md`: setup, runbook, structure, and contributor workflow.
2. `API.md`: current backend routes and payload contracts.
3. `DATABASE.md`: schema and migration-backed fields.
4. `SOLUTION.md`: deep product narrative and architecture explanation.
5. `AGENTS.md`: repository engineering guardrails.

## Repository Structure

```text
gigHood/
├── backend/
│   ├── api/
│   ├── services/
│   ├── scheduler/
│   └── tests/
│
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── store/
│
├── supabase/
│   └── migrations/
│
├── scripts/
├── tests/
│
├── setup.sh
├── setup.bat
├── docker-compose.yml
├── README.md
├── API.md
├── DATABASE.md
├── SOLUTION.md
└── AGENTS.md
```

## Prerequisites

1. Python 3.11+
2. Node.js 20+
3. npm 10+
4. Docker Desktop (optional)

## Quick Start (Recommended)

### Mac/Linux

1. Open terminal in repo root.
2. Run:

```bash
chmod +x setup.sh
./setup.sh
```

### Windows

1. Open Command Prompt or PowerShell in repo root.
2. Run:

```bat
setup.bat
```

The setup scripts initialize Python environment, install dependencies, and scaffold local env files.

## Environment Configuration

Create/update `backend/.env` with at least:

1. `SUPABASE_URL`
2. `SUPABASE_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `JWT_SECRET`
5. `RAZORPAY_KEY_ID`
6. `RAZORPAY_KEY_SECRET`
7. `OPENROUTER_API_KEY`
8. `GROQ_API_KEY`
9. `FIREBASE_CREDENTIALS_PATH` (or equivalent JSON secret strategy)

## Run Locally

### Backend

From repo root:

```bash
source venv/bin/activate
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8001
```

Windows (if using venv):

```bat
venv\Scripts\activate
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8001
```

### Frontend

In a separate terminal:

```bash
cd frontend
npm ci
npm run dev
```

## URLs

1. Frontend: `http://localhost:3000`
2. Backend API: `http://127.0.0.1:8001`
3. OpenAPI docs: `http://127.0.0.1:8001/docs`

## Docker Workflow

From repo root:

```bash
docker compose up --build -d
```

Stop:

```bash
docker compose down
```

## Worker App Routes

1. `/worker-app/login`
2. `/worker-app/register`
3. `/worker-app/home`
4. `/worker-app/payouts`
5. `/worker-app/profile`
6. `/worker-app/chat`

## Validation Commands

From repo root:

```bash
pytest
```

From `frontend/`:

```bash
npm run lint
npm run build
```

## CI/CD Overview

This repository already has GitHub Actions workflows in `.github/workflows/`.

1. `frontend.yml`
	- Runs on frontend changes.
	- Uses Node 20.
	- Executes `npm ci`, `npm run lint`, and `npm run build` inside `frontend/`.
	- This confirms frontend dependencies install and production build succeeds.

2. `backend.yml`
	- Runs on backend changes.
	- Uses Python 3.11.
	- Installs `backend/requirements.txt` and runs backend test suite.
	- This does not run local setup scripts; it performs clean CI dependency install and test execution.

3. `docker-image.yml`
	- Runs Docker build checks on backend/docker workflow changes.
	- Verifies the root `Dockerfile` builds successfully in CI.

4. `docker-publish.yml`
	- Builds and publishes Docker image(s) to GHCR on `main` and version tags.

5. `render-cd.yml`
	- Optional Render deployment trigger workflow.
	- Supports backend deploy + healthcheck only.
	- On manual run (`workflow_dispatch`), pass:
		- `backend_deploy_hook_url`
		- `backend_healthcheck_url` (optional)
	- If these inputs are not provided, deploy/healthcheck steps are skipped and logged in workflow summary.

## Notes on Real vs Demo Behavior

1. Policy and DCI endpoints use live database values.
2. Demo endpoints under `/workers/me/demo/*` are simulation routes and can produce synthetic claim flows.
3. Razorpay fallback mode is used when payout credentials are missing/invalid.

## Contributor Rules

1. Keep schema changes migration-first in `supabase/migrations/`.
2. Keep docs aligned whenever routes/schema/business logic changes.
3. Do not commit secrets.

