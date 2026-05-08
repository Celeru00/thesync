# TheSync Frontend

Web client for TheSync — the scheduling platform for thesis consultations and defense coordination.

Built with **Next.js 14** (App Router, TypeScript), styled with **Tailwind CSS** and **shadcn/ui**, and communicating with the FastAPI backend via a centralized **Axios** client.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Running the app](#running-the-app)
- [API client setup](#api-client-setup)
- [Testing](#testing)
- [Code style](#code-style)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Tech stack

| Layer         | Technology                                     |
| ------------- | ---------------------------------------------- |
| Framework     | Next.js 14 (App Router)                        |
| Language      | TypeScript                                     |
| Styling       | Tailwind CSS + shadcn/ui                       |
| HTTP client   | Axios (centralized instance with interceptors) |
| Data fetching | TanStack Query (React Query)                   |
| Auth          | Supabase Auth (Google OAuth)                   |
| Forms         | React Hook Form + Zod                          |
| Calendar UI   | FullCalendar / react-big-calendar _(TBD)_      |
| Linting       | ESLint + Prettier                              |
| Testing       | Vitest + React Testing Library                 |
| Deployment    | Vercel                                         |

---

## Prerequisites

- **Node.js 20 LTS or newer** — check with `node --version`
- **npm 10+** (or pnpm / yarn if preferred — the team uses npm by default)
- **Git** — check with `git --version`
- A running **backend** (local or staging) — see [`thesissync-backend`](https://github.com/CMSC-186-ThesiSync/thesissync-backend)

---

## Local setup

```bash
# 1. Clone
git clone git@github.com:CMSC-186-ThesiSync/thesissync-frontend.git
cd thesissync-frontend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# then open .env.local and fill in the values

# 4. Run the dev server
npm run dev
```

The app will be live at **http://localhost:3000**.

---

## Environment variables

Next.js loads `.env.local` automatically in development. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser — **never put secrets in these**.

| Variable                               | Description                                 | Example                   |
| -------------------------------------- | ------------------------------------------- | ------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`             | Base URL of the FastAPI backend             | `http://localhost:8000`   |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL                        | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (safe for browser) | `sb_publishable_...`      |
| `NEXT_PUBLIC_APP_URL`                  | This app's own URL (for OAuth callbacks)    | `http://localhost:3000`   |

> **Never commit `.env.local`** — it's in `.gitignore`.

---

## Project structure

```
thesissync-frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── callback/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── schedule/
│   │   ├── calendar/
│   │   └── notifications/
│   ├── api/                      # Next.js route handlers (if needed)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── calendar/
│   ├── schedule/
│   └── shared/
├── lib/
│   ├── api.ts                    # Central Axios instance
│   ├── supabase.ts               # Supabase client
│   └── utils.ts
├── hooks/                        # Custom React hooks
├── types/                        # Shared TypeScript types
├── public/                       # Static assets
├── styles/
│   └── globals.css
├── .env.example
├── .gitignore
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Running the app

```bash
# Development (hot reload, source maps)
npm run dev

# Production build
npm run build
npm run start

# Type checking without building
npm run type-check

# Lint
npm run lint
```

---

## API client setup

We use a **single, centralized Axios instance** (`lib/api.ts`) to talk to the backend. All API calls go through this so we get consistent auth, error handling, and types.

### Key features

- **Base URL:** reads from `NEXT_PUBLIC_API_BASE_URL`
- **Request interceptor:** automatically attaches the Supabase JWT to the `Authorization` header
- **Response interceptor:** catches `401 Unauthorized` and triggers sign-out; normalizes error messages
- **Typed requests:** TypeScript interfaces mirror the FastAPI Pydantic models

### Example

```ts
// lib/api.ts (excerpt)
import axios from "axios";
import { supabase } from "@/lib/supabase";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

### Usage with TanStack Query

```ts
// hooks/useSchedules.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Schedule } from "@/types/schedule";

export function useSchedules() {
  return useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data } = await api.get<Schedule[]>("/api/schedule");
      return data;
    },
  });
}
```

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

CI runs tests on every PR.

---

## Code style

- **Formatting:** Prettier
- **Linting:** ESLint (Next.js recommended rules)
- **Pre-commit:** Husky runs lint and type-check before each commit _(to be added)_

```bash
# Format all files
npm run format

# Check formatting without writing
npm run format:check

# Lint
npm run lint

# Auto-fix
npm run lint:fix
```

CI will fail if code isn't formatted or has lint/type errors.

---

## Deployment

Production is deployed to **Vercel** via GitHub integration.

- **`main` branch** auto-deploys to production
- **Every PR** gets a preview deployment with its own URL
- Environment variables configured in the Vercel dashboard
- Custom domain (e.g. `thesync.app`) with automatic HTTPS

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
   - `style:` formatting, no code logic change
   - `refactor:` code change that neither fixes a bug nor adds a feature
   - `test:` adding tests
   - `chore:` tooling, config
3. Push and open a PR against `main`.
4. Wait for CI to pass and at least one teammate to approve.
5. Squash-merge.

> Direct pushes to `main` are blocked by branch protection. See `.github/pull_request_template.md` for what to include in your PR description.

---

## Team

- **Francis Reid Arranguez** — Project Lead & Backend Developer ([@{LEAD_USERNAME}](https://github.com/{LEAD_USERNAME}))
- **Gabrielle Xiane Bautista** — Frontend Developer & UI/UX Designer ([@{FRONTEND_USERNAME}](https://github.com/{FRONTEND_USERNAME}))
- **John Andrei Manalo** — Integrations Engineer ([@{INTEGRATIONS_USERNAME}](https://github.com/{INTEGRATIONS_USERNAME}))

---

_CMSC 186 · UP Mindanao · April 2026_
