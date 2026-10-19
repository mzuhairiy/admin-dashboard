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

### Full stack with Docker Compose

```bash
cp .env.example .env
# replace AUTH_SECRET with: openssl rand -base64 32
docker compose up --build -d --wait
```

Open http://localhost:3000. Compose starts PostgreSQL, applies production migrations,
seeds a fresh database with 5,000 deterministic transactions, and starts the production
Next.js server. Subsequent starts preserve the database and skip automatic seeding.

Useful commands:

```bash
docker compose logs -f app       # application logs
docker compose ps                # service/health status
docker compose down              # stop containers; keep database volume
docker compose down --volumes    # remove containers and database data
```

Set `APP_PORT` and the matching `AUTH_URL` in `.env` when port 3000 is unavailable.
PostgreSQL remains exposed at `localhost:5434` for Prisma Studio or other local tools.

### Host development

Keep PostgreSQL in Docker while running Next.js with hot reload on the host:

```bash
cp .env.example .env
docker compose up -d postgres

npm ci
npx prisma migrate dev
npm run db:seed        # 5,000 deterministic transactions
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
| `npm run db:migrate` | Apply committed migrations in production/Compose   |
| `npm run format`     | Prettier write                                     |

## Design principles

- **Deterministic data** — fixed faker seed (`12345`), fixed `FIXED_NOW = 2026-01-01T00:00:00Z`;
  every number on screen can be recomputed independently.
- **Read-only** — data comes from the seed script (simulating an upstream system), no CRUD forms.
- **Filter state in the URL** — deep-linkable, refresh-safe, automatable.
- **Testability hooks** — stable `data-testid` everywhere, `data-value` on chart points,
  `data-iso` (ISO UTC) on transaction dates, deterministic CSV filenames.

## Implementation status

The six core SUT phases are implemented: seeded data, authentication/RBAC, dashboard,
transactions/CSV, revenue breakdown with category drill-down, and persisted settings.
The October 2026 correctness review fixed status-filtered charts, daylight-saving date
arithmetic, Revenue's 30D selection, table/export query parity, out-of-range pagination,
sign-in redirect validation, and chart currency preferences.

Revenue counts **PAID** amounts within the active filters. Dashboard average order value
uses paid orders; order totals and refund rates use all matching orders. Currency settings
(IDR/USD/SGD) change formatting only. Trends use daily buckets through 90 days and monthly
buckets for longer ranges. `/revenue` defaults to 1y; the other analytics pages use 30d.

See [QA-HANDOFF.md](QA-HANDOFF.md) for the current automation contract and verification
notes. Katalon automation and the cross-project portfolio remain separate deliverables.

See `PROJECT_PLAN.md` for the full plan and `CLAUDE.md` for coding rules.
