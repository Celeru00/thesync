# ThesisSync Backend

REST API powering ThesisSync's scheduling, authentication, and integration logic.

Built with **FastAPI** (Python 3.12+), backed by **Supabase/PostgreSQL**, and integrated with **Google Calendar** and **SendGrid/Gmail** for calendar sync and notifications.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Running the server](#running-the-server)
- [API documentation](#api-documentation)
- [Testing](#testing)
- [Code style](#code-style)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | FastAPI (async Python) |
| Runtime | Python 3.12+ |
| Database | Supabase (managed PostgreSQL) with Row-Level Security |
| Auth | Supabase Auth + Google OAuth 2.0 |
| Calendar | Google Calendar API |
| Email | SendGrid API (primary) / Gmail API (fallback) |
| Validation | Pydantic v2 |
| Migrations | Supabase migrations |
| Testing | pytest, httpx |
| Linting | Ruff, Black |
| Deployment | Docker → Render / Railway |

---

## Prerequisites

- **Python 3.12 or newer** — check with `python --version`
- **Git** — check with `git --version`
- A **Supabase project** — create one free at [supabase.com](https://supabase.com)
- A **Google Cloud project** with Calendar API and Gmail API enabled (only needed when working on integrations)
- A **SendGrid account** (free tier) — optional if using Gmail API instead

---

## Local setup

```bash
# 1. Clone
git clone git@github.com:CMSC-186-ThesiSync/thesissync-backend.git
cd thesissync-backend

# 2. Create or sync the project virtualenv
uv sync --dev

# 3. Set up your environment variables
cp .env.example .env
# then open .env and fill in the values
```

Use the repo-local virtualenv for commands. Supported workflows use `make ...` or `.venv/bin/python -m ...`, not globally installed tools.

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description | Where to get it |
|---|---|---|
| `APP_ENV` | `development`, `staging`, or `production` | Pick one |
| `SECRET_KEY` | Random string for JWT signing | Generate with `openssl rand -hex 32` |
| `SUPABASE_URL` | Your Supabase project URL | Supabase dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Public anon key | Same place |
| `SUPABASE_SERVICE_KEY` | Service role key (server-side only) | Same place — **never commit** |
| `GOOGLE_CLIENT_ID` | OAuth client ID | Google Cloud → Credentials |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | Same place |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | e.g. `http://localhost:8000/auth/callback` |
| `SENDGRID_API_KEY` | SendGrid API key | SendGrid dashboard |
| `SENDGRID_FROM_EMAIL` | Verified sender email | Configured in SendGrid |
| `FRONTEND_URL` | Allowed CORS origin | e.g. `http://localhost:3000` |

> **Never commit `.env`** — it's in `.gitignore`. If you accidentally commit secrets, rotate them immediately.

---

## Project structure

```
thesissync-backend/
├── app/
│   ├── main.py                 # FastAPI entry point
│   ├── core/
│   │   ├── config.py           # Pydantic Settings
│   │   ├── security.py         # JWT, password hashing
│   │   └── dependencies.py     # Reusable FastAPI deps
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── schedules.py
│   │       ├── availability.py
│   │       └── notifications.py
│   ├── models/                 # Pydantic models
│   ├── schemas/                # Request/response schemas
│   ├── services/               # Business logic
│   │   ├── calendar_service.py
│   │   ├── email_service.py
│   │   └── schedule_service.py
│   ├── db/
│   │   ├── supabase_client.py
│   │   └── migrations/
│   └── utils/
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .gitignore
├── Dockerfile
├── requirements.txt
├── requirements-dev.txt
└── README.md
```

---

## Running the server

```bash
# Dev server with hot reload
make dev
```

The API will be live at `http://localhost:8000`.

---

## API documentation

FastAPI auto-generates OpenAPI docs. Once the server is running:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

### Core endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Google OAuth login |
| `POST` | `/api/schedule` | Create a consultation/defense request |
| `GET` | `/api/schedule` | List schedules (filtered by role) |
| `GET` | `/api/schedule/{id}` | Get schedule details |
| `PUT` | `/api/schedule/{id}/approve` | Adviser approves a request |
| `PUT` | `/api/schedule/{id}/reject` | Adviser rejects a request |
| `PUT` | `/api/schedule/{id}/reschedule` | Reschedule a request |
| `DELETE` | `/api/schedule/{id}` | Cancel a schedule |
| `GET` | `/api/availability/{adviserId}` | Get adviser's free slots |
| `GET` | `/api/notifications` | List user notifications |
| `POST` | `/api/calendar/sync` | Sync with Google Calendar |

---

## Testing

```bash
# Run the local quality gate
make check

# Apply migrations
make db-upgrade
```

CI runs both unit and integration tests on every PR.

---

## Code style

- **Formatting:** Black (line length 100)
- **Linting:** Ruff
- **Type hints:** Required on all public functions

```bash
# Auto-fix and format
make fix

# Verification
make check
```

CI will fail if code isn't formatted or has lint errors.

---

## Deployment

Production is deployed to **Render** (or Railway — decision to be finalized).

- **`main` branch** auto-deploys to production
- Docker-based builds using the included `Dockerfile`
- Environment variables configured in the hosting dashboard
- CORS restricted to the Vercel frontend domain

See `SETUP_GUIDE.md` in the org for deployment steps.

---

## Contributing

We use **GitHub Flow**: branch → commit → PR → review → merge.

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/short-description
   ```
2. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation only
   - `refactor:` code change that neither fixes a bug nor adds a feature
   - `test:` adding tests
   - `chore:` tooling, config
3. Push and open a PR against `main`.
4. Wait for CI to pass and at least one teammate to approve.
5. Squash-merge (keeps main history clean).

> Direct pushes to `main` are blocked by branch protection. See `.github/pull_request_template.md` for what to include in your PR description.

---

## Team

- **Francis Reid Arranguez** — Backend Developer
- **Gabrielle Xiane Bautista** — Frontend Developer
- **John Andrei Manalo** — Integrations Engineer

---

*CMSC 186 · UP Mindanao · April 2026*
