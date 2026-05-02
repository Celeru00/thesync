# Contributing to TheSync

This document covers everything you need to set up, develop, and ship code for thesync. Read it once before writing your first line of code.

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Repository structure](#2-repository-structure)
3. [Initializing the repo](#3-initializing-the-repo)
4. [Environment variables](#4-environment-variables)
5. [Trunk-based development](#5-trunk-based-development)
6. [Branch naming](#6-branch-naming)
7. [Clean code architecture](#7-clean-code-architecture)
8. [Conventional commits](#8-conventional-commits)
9. [Keeping your branch linear (rebase)](#9-keeping-your-branch-linear-rebase)
10. [Pull requests](#10-pull-requests)
11. [CI checks](#11-ci-checks)

---

## 1. Architecture overview

thesync follows a **three-tier architecture** with a clear separation between the presentation layer, application layer, and data layer.

```
┌─────────────────────────────────────────────┐
│              Presentation Layer             │
│         Next.js 14 (React + TypeScript)     │
│   Tailwind CSS · shadcn/ui · Axios · Vercel │
└─────────────────────┬───────────────────────┘
                      │ HTTPS / REST
┌─────────────────────▼───────────────────────┐
│              Application Layer              │
│           FastAPI (Python 3.12+)            │
│     Pydantic v2 · Supabase client · Docker  │
│              Hosted on Render               │
└─────────────────────┬───────────────────────┘
                      │ SQL / RLS
┌─────────────────────▼───────────────────────┐
│                 Data Layer                  │
│          Supabase (PostgreSQL)              │
│       Row-Level Security · Auth · Realtime  │
└─────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│              Integration Layer              │
│  Google Calendar API · SendGrid · OAuth 2.0 │
└─────────────────────────────────────────────┘
```

**Request flow**

1. Student submits a consultation request through the Next.js frontend via an Axios `POST` call.
2. FastAPI validates the request, checks adviser availability against the database, and stores the schedule.
3. The adviser receives an email notification (SendGrid) and sees the request in their dashboard.
4. On approval, FastAPI calls the Google Calendar API to create an event with a Meet link.
5. Both parties receive a confirmation email and the schedule status updates in real time.

---

## 2. Repository structure

```
thesync/
├── thesync-frontend/                  # Next.js 14 application
│   ├── app/                   # App Router pages and layouts
│   │   ├── (auth)/            # Login, OAuth callback
│   │   └── dashboard/         # Role-based dashboard routes
│   │       ├── student/
│   │       ├── adviser/
│   │       ├── panelist/
│   │       └── admin/
│   ├── components/            # Shared UI components
│   ├── lib/
│   │   ├── api.ts             # Centralized Axios instance
│   │   ├── supabase.ts        # Supabase client
│   │   └── utils.ts
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript interfaces
│   └── middleware.ts          # Auth guard
│
├── thesync-backend/                   # FastAPI application
│   ├── app/
│   │   ├── main.py            # App entry point, CORS config
│   │   ├── routers/           # One file per resource
│   │   │   ├── auth.py
│   │   │   ├── schedules.py
│   │   │   ├── availability.py
│   │   │   ├── notifications.py
│   │   │   └── calendar.py
│   │   ├── models/            # Pydantic request/response models
│   │   ├── services/          # Business logic (no DB calls here)
│   │   ├── repositories/      # All DB queries live here
│   │   ├── dependencies/      # FastAPI dependency injection
│   │   └── core/              # Config, constants, enums
│   ├── tests/
│   └── Dockerfile
│
├── supabase/
│   ├── migrations/            # SQL migration files
│   └── seed.sql               # Test data
│
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       └── codeql.yml
│
├── .env.example               # All required env vars documented
├── CONTRIBUTING.md            # This file
└── README.md
```

---

## 3. Initializing the repo

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker Desktop
- Supabase CLI

### Clone and bootstrap

```bash
git clone https://github.com/Celeru00/thesync.git
cd thesync
```

### Frontend setup

```bash
cd thesync-frontend
npm install
npm run dev                        # runs on http://localhost:3000
```

### Backend setup

```bash
cd thesync-backend
source .venv/bin/activate          # Windows: .venv\Scripts\activate
uv sync --all-groups --all-extras
uvicorn main:app --reload      # runs on http://localhost:8000
```

OpenAPI docs are available at `http://localhost:8000/docs` once the backend is running.

---

## 4. Environment variables

Never commit secrets. All required variables are documented in `.env.example` at the repo root. Copy it to `.env.local` for local development — this file is gitignored.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Calendar
GOOGLE_CALENDAR_CREDENTIALS=      # base64-encoded service account JSON

# SendGrid
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# App
NEXT_PUBLIC_API_BASE_URL=          # FastAPI URL (http://localhost:8000 locally)
```

Secrets for production are stored in the Vercel dashboard (frontend) and Render dashboard (backend) — never in the repository.

---

## 5. Trunk-based development

We use **trunk-based development**. There is one long-lived branch: `main`. Everything else is a short-lived feature branch that lives for at most a few days.

**Rules**

- `main` is always deployable. Never push broken code to `main`.
- Feature branches are cut from `main` and merged back via pull request.
- Branches should stay small — one ticket, one branch.
- Do not create `develop`, `staging`, or `release` branches. Vercel preview URLs replace the need for a staging branch.
- Delete your branch after it merges.

**Flow**

```
main ──────────────────────────────────────────► (always deployable)
        │                    ▲
        │  git checkout -b   │  PR + squash merge
        ▼                    │
  yourname/ts-010-...  ──────┘
```

---

## 6. Branch naming

When you pick up a ticket in Linear, **copy the branch name Linear generates for it**. It follows this format:

```
yourname/ts-010-bootstrap-nextjs-14-with-tailwind-and-axios
```

Create it like this:

```bash
git checkout main
git pull origin main
git checkout -b yourname/ts-010-bootstrap-nextjs-14-with-tailwind-and-axios
```

---

## 7. Clean code architecture

### Frontend (Next.js)

Follow a clear separation between UI, data fetching, and business logic.

```
components/     → pure UI, no direct API calls, receives props
hooks/          → data fetching with TanStack Query, returns data + state
lib/api.ts      → all Axios calls, typed with request/response interfaces
types/          → shared TypeScript interfaces mirroring Pydantic models
app/            → pages and layouts only, composes hooks + components
```

**Rules**

- Components do not call Axios directly — all API calls go through `lib/api.ts`.
- Each function does one thing. If it needs a comment to explain what it does, split it.
- No `any` types. Every API response must have a TypeScript interface in `types/`.
- Keep components under 200 lines. Extract when they grow.
- Co-locate tests with the file they test: `MyComponent.test.tsx` next to `MyComponent.tsx`.

### Backend (FastAPI)

Follow a layered architecture — requests flow downward, never skip layers.

```
routers/        → HTTP concerns only (request parsing, response shaping)
services/       → business logic, orchestrates repositories
repositories/   → all database queries, returns domain objects
models/         → Pydantic schemas for request/response validation
dependencies/   → reusable FastAPI deps (auth, db session, role checks)
```

**Rules**

- Routers do not contain business logic — delegate to services.
- Services do not contain raw SQL — delegate to repositories.
- Never expose internal database IDs or implementation details in API responses.
- All endpoints must have a Pydantic response model — no bare `dict` returns.
- Every router dependency that requires authentication must use the `get_current_user` dependency.

---

## 8. Conventional commits

Every commit message must follow the **Conventional Commits** format:

```
<type>(<scope>): <short description>
```

The description must be lowercase and imperative — write what the commit *does*, not what you *did*.

### Allowed types

| Type | When to use |
|---|---|
| `feat` | A new feature or endpoint |
| `fix` | A bug fix |
| `chore` | Tooling, dependencies, config (no production logic) |
| `docs` | Documentation only |
| `refactor` | Code restructure with no behavior change |
| `test` | Adding or updating tests |
| `ci` | Changes to CI/CD workflows |

### Examples

```bash
feat(auth): implement google oauth login endpoint
fix(schedule): prevent double-booking on overlapping slots
chore(deps): add axios and tanstack-query to frontend
refactor(services): extract availability logic into separate service
test(schedules): add unit tests for approval endpoint
ci(frontend): add eslint and build check on pull requests
docs(api): add openapi spec for schedule endpoints
```

### Rules

- Description is lowercase, no period at the end.
- Scope is the area of the codebase affected (e.g. `auth`, `schedule`, `frontend`, `db`).
- Keep the subject line under 72 characters.
- If the commit closes a Linear ticket, add it in the footer: `Closes THE-10`.

---

## 9. Keeping your branch linear (rebase)

We use **rebase instead of merge** to keep the commit history linear and readable. A linear history makes `git log`, `git bisect`, and code reviews significantly easier.

**Never do this:**

```bash
git merge main    # ❌ creates a merge commit, pollutes history
```

### Syncing with main during development

If `main` has moved ahead while you're working on your branch:

```bash
git fetch origin
git rebase origin/main
# fix any conflicts, then:
git push -f
```

### Fixing a messy branch before opening a PR

If your branch has several WIP commits and you want to clean up before review, use the soft-reset + stash method. Replace `<n>` with the number of commits on your branch:

```bash
# Step 1: squash all your commits into one staged change
git reset --soft HEAD~<n>

# Step 2: stash the staged changes
git stash

# Step 3: rebase onto latest main
git pull origin main -r

# Step 4: re-apply your work
git stash pop

# Step 5: fix merge conflicts if any, then commit and force-push
git add .
git commit -m "feat(scope): your commit message"
git push -f
```

> `git push -f` is safe here because you are rewriting history on your own feature branch only. Branch protection on `main` prevents force-pushing there.

### How to count your commits

```bash
git log --oneline origin/main..HEAD
```

This lists only the commits on your branch that are not on `main`.

---

## 10. Pull requests

- One ticket = one PR. Keep PRs small and focused.
- Title must match the commit format: `feat(auth): implement google oauth login`.
- Fill in the PR template — description, screenshots for UI changes, and the Linear ticket link.
- All CI checks must pass before requesting review.
- At least **one approval** is required before merging.
- Use **squash and merge** — this keeps one clean commit per PR on `main`.
- Delete your branch after merging.

### PR template

When you open a PR, fill in this template:

```markdown
## What this does
<!-- One paragraph describing the change -->

## Linear ticket
Closes THE-XX

## Screenshots (UI changes only)
<!-- Before / after if applicable -->

## Checklist
- [ ] CI checks pass
- [ ] No console.log or debug code left in
- [ ] Types are defined (no `any`)
- [ ] Self-reviewed the diff before requesting review
```

---

## 11. CI checks

Two GitHub Actions workflows run on every PR.

### `frontend-ci.yml` — runs on every PR to `main`

| Check | Command | Blocks merge? |
|---|---|---|
| ESLint | `npm run lint` | Yes |
| Build check | `npm run build` | Yes |

### `codeql.yml` — runs on push to `main` and weekly

Performs static security analysis on the JavaScript/TypeScript codebase. Results appear under **Security → Code scanning** in GitHub. Critical findings must be resolved before the next sprint ends.

---

*Last updated: May 2026 · thesync · CMSC 186 UP Mindanao*