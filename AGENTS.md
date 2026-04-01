# AGENTS.md — gigHood

## 1. Project Context

**gigHood** is an AI-powered parametric income insurance platform for India's 15M+ gig delivery workers (Zepto, Blinkit, Swiggy Instamart). It auto-detects zone-level earning collapse using the **Demand Collapse Index (DCI)** — a multi-signal spatial ML model computed per H3 hex cell every 5 minutes — and pays workers via UPI within 90 seconds, with zero paperwork and 7-layer fraud defense.

See [README.md](README.md) for full product vision and problem context.

---

## 2. Source of Truth

| Document | Role |
|:---|:---|
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | **Authoritative technical specification** — architecture, modules, data models, pipeline stages, testing plan |
| [README.md](README.md) | Product intent, business context, and user-facing system descriptions |
| [API.md](API.md) | **API contract** — FastAPI endpoint specifications, request/response schemas |
| [DATABASE.md](DATABASE.md) | **Database schema** — table definitions, RLS policies, migration guide |
| [SETUP.md](SETUP.md) | **Environment setup** — dependency installation, local dev configuration |

**Agents must follow [IMPLEMENTATION.md](IMPLEMENTATION.md) for all technical decisions.** If there is a conflict between [README.md](README.md) and [IMPLEMENTATION.md](IMPLEMENTATION.md), [IMPLEMENTATION.md](IMPLEMENTATION.md) wins.

---

## 3. Development Workflow

**Before any work, read [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 2–3 to understand the system architecture and module definitions.** All implementation must follow the prescribed architecture—do not invent new patterns or deviate from module boundaries.

1. **Read [IMPLEMENTATION.md](IMPLEMENTATION.md)** — understand the 5-layer system architecture and which module(s) you are working on.
2. **Read [API.md](API.md)** if the task involves FastAPI endpoints — verify request/response schemas.
3. **Read [DATABASE.md](DATABASE.md)** if the task involves database work — review table definitions and RLS policies.
4. **Work module-by-module** as defined in [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 3. Do not mix concerns across modules.
5. **Build minimal working implementations first**, then add error handling, retries, and robustness.
6. **Verify against the testing plan** in [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 8 before considering a module complete.

### Key System Components (from [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 3)

| Layer | Module | Purpose |
|:---|:---|:---|
| 1 | Signal Ingestion | Fetch 5 external signals (weather, AQI, traffic, platform, social) every 5min |
| 2 | DCI Engine | Compute `DCI_h = σ(0.45·W + 0.25·T + 0.20·P + 0.10·S)` per hex |
| 3 | Policy Engine | Risk profiling, premium calculation, policy lifecycle management |
| 4 | Claims Automation | Trigger monitoring, PoP validation, fraud detection, payout execution |
| 5 | Payout & UI | UPI transfer via Razorpay, worker/admin frontends, notifications |
| + | Fraud Defense | 7-layer adversarial defense with 4-path routing (Fast Track / Soft Queue / Active Verify / Denied) |

---

## 4. Agent Skills

Reusable skills are in [.agents/skills/](.agents/skills/). **Check for a relevant skill before implementing complex functionality.** Prefer using an existing skill over recreating patterns from scratch.

### Skill Usage Protocol (Mandatory)

1. **Any UI/UX task (web, mobile, components, layout, visual polish, accessibility) must start with `ui-ux-pro-max`.**
	- Load [.agents/skills/ui-ux-pro-max/SKILL.md](.agents/skills/ui-ux-pro-max/SKILL.md) **first** before implementing or refactoring any screen/component.
	- This skill covers: style direction, layout systems, accessibility, motion, typography, color systems, component quality checks across React Native and Next.js.

2. **Stack skills appropriately after loading `ui-ux-pro-max`:**
	- Next.js UI: [nextjs-development](.agents/skills/nextjs-development/) + ([shadcn-ui](.agents/skills/shadcn-ui/) or [react-components](.agents/skills/react-components/) as needed)
	- Frontend visual styling: [frontend-design](.agents/skills/frontend-design/) + [web-design-guidelines](.agents/skills/web-design-guidelines/)
	- Mobile UI: [ui-mobile](.agents/skills/ui-mobile/)

3. **For backend/API/database work, pick domain skills first:**
	- Python/FastAPI: [python-backend](.agents/skills/python-backend/), [api-testing](.agents/skills/api-testing/)
	- Database: [supabase-database](.agents/skills/supabase-database/), [supabase-postgres-best-practices](.agents/skills/supabase-postgres-best-practices/), [postgres-patterns](.agents/skills/postgres-patterns/)
	- ML: [xgboost-lightgbm](.agents/skills/xgboost-lightgbm/)

4. **Do not skip skill loading for complex tasks.** Skills encode tested patterns and best practices essential for production-grade code.

### Available Skills

| Skill | Use When |
|:---|:---|
| **ui-ux-pro-max** | **MANDATORY FIRST for UI/UX work** — style direction, layout systems, accessibility, motion, typography, color systems, component quality |
| nextjs-development | Admin Dashboard pages, routing, server components, data fetching |
| shadcn-ui | Admin Dashboard UI components, component library patterns |
| react-components | Shared frontend component patterns, component reusability |
| frontend-design | Design system, color palette, layout patterns |
| web-design-guidelines | Accessibility, responsive design, typography, touch-target sizing |
| ui-mobile | React Native screens, navigation, mobile UX patterns |
| python-backend | FastAPI route design, async patterns, dependency injection |
| api-testing | Integration testing FastAPI endpoints, mocking external APIs |
| supabase-database | Supabase client queries, RLS policy enforcement, real-time subscriptions |
| supabase-postgres-best-practices | Writing migrations, enabling RLS, designing table schemas |
| postgres-patterns | Writing complex SQL queries, indexes, transactions, performance tuning |
| xgboost-lightgbm | Training the Risk Profiler model, hyperparameter tuning, SHAP values |
| python-testing | pytest fixtures, unit tests, mocking |
| payment-integration | Razorpay webhook handling, idempotency, sandbox testing |
| design-md | Creating or updating high-quality design documentation and UI specs |
| find-skills | Discovering which skill to apply for unfamiliar tasks |
| enhance-prompt | Improving prompts for clearer, higher-quality generation |
| stitch-loop | Iterative UI generation/refinement workflows |
| remotion | Motion/video-style UI composition tasks |
| skill-creator | Creating new skills for frequently-used patterns |

---

## 5. Implementation Rules

- **Do not invent new architecture.** Follow the 5-layer architecture defined in [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 2.
- **Respect module boundaries.** Each module listed in [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 3 has defined inputs, outputs, and connections — do not cross them.
- **Use the defined tech stack:** FastAPI, React Native (worker app), Next.js (admin dashboard), Supabase/PostGIS, H3 grids, XGBoost, APScheduler, Razorpay.
- **Do not introduce new libraries** without justification. If a skill already covers a pattern, use it.
- **Avoid large refactors** unless [IMPLEMENTATION.md](IMPLEMENTATION.md) explicitly requires restructuring.
- **DCI formula is fixed:** `DCI_h = σ(0.45·W + 0.25·T + 0.20·P + 0.10·S)` — do not change weights without updating the ML optimization logic simultaneously.
- **Fraud score calculation** must follow the 7-layer defense defined in [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 3.5 exactly.

---

## 6. File Structure Discipline

Follow the current repository structure exactly. Align all implementation to this layout:

```
gigHood/
├── backend/                                    # FastAPI backend (Python 3.11+)
│   ├── api/                                    # Route handlers (main.py wires these)
│   ├── db/                                     # Supabase client initialization
│   ├── ml/                                     # Serialized ML model artifacts
│   │   ├── risk_profiler.json
│   │   └── risk_profiler.pkl
│   ├── models/                                 # Pydantic schemas (data validation)
│   │   └── schemas.py
│   ├── scheduler/                              # APScheduler jobs (5min signal fetches, etc)
│   ├── scripts/                                # Utility scripts (data loading, debugging)
│   ├── services/                               # Core business logic modules
│   │   ├── auth_service.py                     # OTP + JWT token generation
│   │   ├── chat_service.py                     # AI chat logic
│   │   ├── claim_approver.py                   # 4-path routing decision logic
│   │   ├── dci_engine.py                       # DCI computation per hex
│   │   ├── fraud_engine.py                     # 7-layer fraud scoring
│   │   ├── notification_service.py             # FCM push notifications
│   │   ├── payment_service.py                  # Razorpay integration
│   │   ├── payout_calculator.py                # Payout amount calculation
│   │   ├── policy_manager.py                   # Policy lifecycle (create/renew/cancel)
│   │   ├── pop_validator.py                    # Proof-of-Presence validation
│   │   ├── premium_bander.py                   # Tier-to-premium mapping
│   │   ├── risk_profiler.py                    # XGBoost risk classification
│   │   ├── signal_fetchers.py                  # 5 external signal APIs
│   │   ├── spatial.py                          # H3 hexgrid utilities
│   │   └── trigger_monitor.py                  # DCI disruption trigger detection
│   ├── tests/                                  # Backend unit + integration tests
│   ├── main.py                                 # FastAPI app entrypoint
│   ├── config.py                               # Configuration management
│   ├── requirements.txt                        # Python dependencies
│   ├── demo_runner.py                          # Demo/testing utilities
│   ├── firebase-credentials.json               # FCM credentials
│   ├── .env                                    # Local environment variables
│   └── .env.example                            # Template for .env
├── frontend/
│   ├── worker-app/                             # Worker-facing Next.js app (React 19)
│   │   ├── src/
│   │   │   ├── app/                            # App Router pages + layouts
│   │   │   │   ├── register/                   # Onboarding flow
│   │   │   │   ├── (dashboard)/                # Authenticated worker routes
│   │   │   │   │   ├── home/                   # Main dashboard (DCI gauge, claims)
│   │   │   │   │   ├── profile/                # Worker profile + settings
│   │   │   │   │   └── ...
│   │   │   │   └── ...
│   │   │   ├── components/                     # Reusable React components
│   │   │   ├── hooks/                          # Custom React hooks (useQuery, useAuth, etc)
│   │   │   ├── lib/                            # Utilities (API client, formatters, validators)
│   │   │   └── store/                          # Zustand state management
│   │   └── ...
│   └── admin-dashboard/                        # Admin-facing Next.js app (React 19)
│       ├── src/
│       │   ├── app/                            # Admin pages (zones, policies, claims review)
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── lib/
│       │   └── store/
│       └── ...
├── supabase/
│   └── migrations/                             # SQL migrations only (Postgres DDL)
├── dataset/                                    # Data assets (dummy worker lists, zone data, etc)
├── .agents/
│   └── skills/                                 # Local skill registry (22 available skills)
│       ├── ui-ux-pro-max/
│       ├── nextjs-development/
│       ├── python-backend/
│       ├── supabase-database/
│       ├── xgboost-lightgbm/
│       ├── ... (19 more skills)
│       └── SKILL.md files in each skill folder
├── .github/
│   └── workflows/                              # CI/CD pipelines
│       ├── backend.yml                         # Backend tests on push/PR
│       └── frontend.yml                        # Frontend lint/build on push/PR
├── AGENTS.md                                   # **This file** — agent workflow & skills
├── IMPLEMENTATION.md                           # Authoritative technical specification
├── README.md                                   # Product vision & problem context
├── API.md                                      # API contract & endpoint specs
├── DATABASE.md                                 # Table schemas & RLS policies
├── SETUP.md                                    # Environment setup instructions
├── docker-compose.yml                          # Local dev environment (backend + postgres)
└── Dockerfile                                  # Backend container image
```

### Key Rules for File Structure

1. **All backend logic goes in `backend/services/`.** Do not scatter business logic across `api/` and `scheduler/`.
2. **All frontend components go in `frontend/worker-app/src/components/` or `frontend/admin-dashboard/src/components/`.** Do not scatter components.
3. **All schema changes go through `supabase/migrations/`.** Never mutate Postgres schema via raw SQL in Python code.
4. **Keep new files within their module folders.** If adding a new signal fetcher, extend `signal_fetchers.py` in `services/` — don't create `backend/fetchers/`.
5. **Workflow filenames must match convention:** `backend.yml`, `frontend.yml`. Keep them synchronized with actual job structure.

---

## 7. Testing Expectations

- Write **unit tests alongside every new module** using `pytest` (use the [python-testing](.agents/skills/python-testing/) skill).
- **DCI formula test:** Validate `σ(0.45·W + 0.25·T + 0.20·P + 0.10·S)` produces expected results against worked examples in [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 3.2.
- **Fraud score test:** Validate the 4-path routing logic routes claims correctly based on compound score thresholds (see [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 3.5).
- **Pipeline integration test:** Run the end-to-end signal → DCI → trigger → claim → payout flow using mocked external APIs.
- Use the [api-testing](.agents/skills/api-testing/) skill for FastAPI endpoint integration tests.
- For frontend: test component rendering, state changes, and API integration using React Testing Library / @testing-library.

---

## 8. Safe Modification Guidelines

- **Do not modify the database schema** (defined in [DATABASE.md](DATABASE.md)) unless working on a dedicated migration task. If you must, create a new migration file in `supabase/migrations/` — never alter existing ones.
- **Do not change DCI signal weights** (α=0.45, β=0.25, γ=0.20, δ=0.10) outside the ML optimization module.
- **Do not alter fraud gate thresholds** without updating the 4-path routing logic consistently (see [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 3.5).
- **If you modify a pipeline stage**, check all downstream stages for consistency (e.g., changing PoP output format must be reflected in the Claim Approver).
- **Prefer additive changes** — new columns, new endpoints — over modifications to existing ones.
- **Always test migrations locally** (see [DATABASE.md](DATABASE.md) for migration setup).

---

## 9. Agent Execution Strategy

When given a task, follow this sequence:

```
1. Read IMPLEMENTATION.md Section 2–3 — understand system architecture and module scope
2. Identify which module(s) you are working on from IMPLEMENTATION.md Section 3
3. Read API.md if task involves FastAPI endpoints
4. Read DATABASE.md if task involves database changes
5. Check .agents/skills/ for relevant skills
   5a. For ANY UI/UX task: load ui-ux-pro-max FIRST, then stack implementation-specific skills
   5b. For backend/API/database: load domain-specific skills first (python-backend, supabase-database, etc)
6. Implement minimal working functionality following the module definition
7. Write unit tests using examples from IMPLEMENTATION.md Section 8
8. Verify module connections to adjacent modules are correct
9. Document changes clearly in commit messages
```

### Pre-Task Checklist

Before starting any implementation:

- [ ] Have you read [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 2–3 for this module?
- [ ] Have you identified the module inputs, outputs, and connections?
- [ ] For UI work: Have you loaded [ui-ux-pro-max](.agents/skills/ui-ux-pro-max/SKILL.md)?
- [ ] For database work: Have you reviewed [DATABASE.md](DATABASE.md)?
- [ ] For API work: Have you reviewed [API.md](API.md)?
- [ ] Do you understand error handling expectations from [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 8?

### Code Quality Expectations

1. **Type safety:** Use type hints in all Python code (FastAPI routes, services). Use TypeScript in all frontend code.
2. **Error handling:** Every external API call must have retry logic + graceful degradation (see [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 3.2 for DCI degradation example).
3. **Idempotency:** Claims processing, payouts, and policy creation must be idempotent (see [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 3.4).
4. **Logging:** Use structured logging (JSON format) for debugging in production.
5. **Testing:** Minimum 70% code coverage for new modules (use pytest with pytest-cov).

---

## 10. Reference & Documentation Standards

### How to Refer to Files (Use Markdown Links)

- **Always use markdown link format:** `[filename](path/to/filename)`
- **Never wrap file names in backticks:** ✗ `` `backend/api/routes.py` `` → ✓ [backend/api/routes.py](backend/api/routes.py)
- **When referencing sections:** Use [Section name](filename#anchor) format
- **When referencing code lines:** Use [filename](path#L45-L60) for line ranges

### How to Document Work (Since MEMORY/TODO/RULES Don't Persist)

All work tracking happens in **git commits** and **pull request descriptions.**

**Standard commit message:**

```
[MODULE_NAME] Brief one-line description

Detailed explanation (if needed):
- What was changed and why
- Cross-module impact (if any)

Related sections:
- IMPLEMENTATION.md Section 3.X (module definition)
- DATABASE.md (if schema changes)
- API.md (if endpoint changes)
```

**Example commit:**

```
[fraud_engine] Implement 7-layer fraud score calculation

- Added compound_fraud_score() combining all 7 defense layers
- Updated claim_approver.py to use fraud score for 4-path routing
- Added 8 test cases (fraud_test_cases.py) validating each layer

Related sections:
- IMPLEMENTATION.md Section 3.5 (7-layer defense architecture)
- API.md POST /claims/{id}/approve (fraud score now in response)
```

### When to Update Documentation Files

- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** — Only if system architecture changes or module definitions need clarification.
- **[API.md](API.md)** — When adding/modifying FastAPI endpoints.
- **[DATABASE.md](DATABASE.md)** — When creating/modifying tables or RLS policies.
- **[SETUP.md](SETUP.md)** — When new dependencies or environment variables are added.
- **New docs** — Create only if truly necessary; always link from relevant master doc.

---

## 11. Troubleshooting & Common Issues

### "Which skill should I use for this task?"

1. Check the **Skill Usage Protocol** in Section 4.
2. If unsure, load [find-skills](.agents/skills/find-skills/) to explore options.
3. For UI work: **Always load [ui-ux-pro-max](.agents/skills/ui-ux-pro-max/) first** — no exceptions.

### "How do I know if this module is complete?"

- [ ] Unit tests pass (pytest coverage ≥70%)
- [ ] Module successfully connects to adjacent modules (see component interaction map in [IMPLEMENTATION.md](IMPLEMENTATION.md) Section 2.3)
- [ ] Error handling + retry logic implemented
- [ ] Commit message documents the work with related section references

### "What should I do if I find a bug in existing code?"

1. Create a focused bug-fix commit with clear description
2. Reference the affected module in [IMPLEMENTATION.md](IMPLEMENTATION.md)
3. Add a test case demonstrating the bug + fix
4. Do not refactor unrelated code in the same commit

### "I need to change the DCI formula / fraud thresholds / database schema"

**Stop.** These are protected components. Before making changes:
1. Document the rationale clearly
2. Update all affected downstream modules
3. Add test cases validating the change across the pipeline
4. Cross-reference [IMPLEMENTATION.md](IMPLEMENTATION.md), [DATABASE.md](DATABASE.md), and [API.md](API.md)

---
