# ADR 0001 — Tech Stack for the Admin Dashboard SUT

- **Status:** Accepted
- **Date:** 2026-07-04

## Context

This repository is a read-only analytics dashboard built as a System Under Test (SUT)
for a QA automation portfolio targeting **Katalon Studio** (data-driven testing:
chart values, CSV integrity, timezone conversion, RBAC). The SUT must be:

1. **Deterministic** — every number on screen must be independently recomputable.
2. **Testable** — stable locators, machine-readable values, deep-linkable state.
3. **Consistent** with sibling portfolio projects (Next.js + Prisma + Auth.js) so the
   focus stays on the QA work, not on relearning stacks.

## Decision

| Concern    | Choice                          | Rationale |
| ---------- | ------------------------------- | --------- |
| Framework  | Next.js 14 (App Router)         | Server components keep all filtering/aggregation server-side; URL query = single source of filter state. Same stack as other portfolio SUTs. |
| Language   | TypeScript (strict)             | Consistency, refactoring safety. |
| Database   | PostgreSQL 16 + Prisma 6        | Prisma `groupBy`/aggregate covers the analytics queries; Postgres in Docker for reproducible local setup. Prisma 6 (not 7) keeps the conventional `schema.prisma` + `DATABASE_URL` workflow supported by `@auth/prisma-adapter` docs. |
| Auth       | Auth.js v5 (credentials, JWT)   | Simple seeded logins; JWT sessions avoid DB round-trips in middleware; edge-safe config split (`auth.config.ts`) for RBAC middleware. |
| UI         | Tailwind + shadcn/ui (slate)    | Consistent look with sibling projects; components ship with sane a11y and accept `data-testid` pass-through. |
| Charts     | Recharts 3                      | SVG-based: custom dot/shape/label render props let every data point carry `data-value` attributes so Katalon asserts numbers without OCR. |
| Dates      | date-fns + date-fns-tz          | Explicit timezone conversion (`fromZonedTime`/`formatInTimeZone`); no reliance on server-local `Date` semantics. Store UTC, display per selected timezone. |
| CSV        | PapaParse (`unparse`)           | RFC 4180 escaping, deterministic output, unit-testable pure function. |
| Seed       | @faker-js/faker, seed `12345`   | Fixed seed + fixed `FIXED_NOW` (2026-01-01T00:00:00Z) → byte-identical data on every run; exact status ratios for stable assertions. |
| Tests      | Vitest + Testing Library        | White-box unit tests (timezone, CSV, aggregation, RBAC helpers) and component smoke tests. E2E automation intentionally lives in a separate Katalon repo. |

## Consequences

- **Positive:** every metric is recomputable from the seed; QA assertions can be exact
  (no tolerances). Timezone bugs are testable because display and storage are decoupled
  (`data-iso` vs visible text). RBAC has three enforcement layers (middleware, page
  guard, API guard).
- **Negative / accepted trade-offs:** the app's "now" is frozen (FIXED_NOW), which is
  unusual for production code but essential for deterministic presets; revenue trend
  bucketing happens in JS rather than SQL (`AT TIME ZONE`), trading a little query
  efficiency for a pure, unit-testable function at the seeded data volume (≤5k rows).
- **Out of scope by design:** CRUD for transactions, real-time updates, Playwright/
  Selenium/Katalon config in this repo.
