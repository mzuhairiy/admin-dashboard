# Admin Dashboard (SUT)

Read-only analytics dashboard built as a **System Under Test** for a QA automation portfolio
(target: Katalon Studio data-driven suite). Focus areas: chart value validation, CSV export
integrity, timezone-aware date filters, and multi-role (RBAC) scenarios.

> Test automation lives in a separate repo — this repo intentionally contains **no**
> Playwright/Selenium/Katalon setup.

## Stack

Next.js 14 (App Router) · TypeScript strict · PostgreSQL + Prisma · Auth.js v5 ·
Tailwind + shadcn/ui · Recharts · date-fns-tz · Vitest

## Setup

```bash
# 1. Start PostgreSQL (exposed on localhost:5434)
docker compose up -d --wait

# 2. Environment
cp .env.example .env
# then set AUTH_SECRET: openssl rand -base64 32

# 3. Install deps
npm install

# 4. Database
npx prisma migrate dev
npm run db:seed        # 5,000 deterministic transactions

# 5. Run
npm run dev            # http://localhost:3000
```

## Seeded logins

| Email                 | Password      | Role    |
| --------------------- | ------------- | ------- |
| `viewer@example.com`  | `Viewer123!`  | VIEWER  |
| `manager@example.com` | `Manager123!` | MANAGER |

**VIEWER** — dashboard + transactions, no CSV export, no `/revenue`.
**MANAGER** — everything VIEWER has + CSV export + `/revenue`.

## Scripts

| Script               | What                                               |
| -------------------- | -------------------------------------------------- |
| `npm run dev`        | Dev server                                         |
| `npm run build`      | Production build                                   |
| `npm run lint`       | ESLint                                             |
| `npm run type-check` | `tsc --noEmit`                                     |
| `npm run test`       | Vitest (unit + component smoke)                    |
| `npm run test:watch` | Vitest watch mode                                  |
| `npm run db:seed`    | Deterministic seed (fixed faker seed, fixed "now") |
| `npm run format`     | Prettier write                                     |

## Design principles

- **Deterministic data** — fixed faker seed (`12345`), fixed `FIXED_NOW = 2026-01-01T00:00:00Z`;
  every number on screen can be recomputed independently.
- **Read-only** — data comes from the seed script (simulating an upstream system), no CRUD forms.
- **Filter state in the URL** — deep-linkable, refresh-safe, automatable.
- **Testability hooks** — stable `data-testid` everywhere, `data-value` on chart points,
  `data-iso` (ISO UTC) on every rendered date, deterministic CSV filenames.

See `PROJECT_PLAN.md` for the full plan and `CLAUDE.md` for coding rules.
