# CLAUDE.md — admin-dashboard (SUT)

Analytics dashboard read-only sebagai **System Under Test** untuk portfolio QA (target: Katalon Studio).

## Prinsip

- **Read-only** — data via seed, bukan CRUD form
- **Deterministic** — fixed random seed, fixed "now" reference, semua timezone eksplisit
- **Dynamic behavior via query** — filter/aggregate/timezone bikin data hidup, bukan CRUD
- **Testability first** — `data-testid` konsisten, chart data attribute, ISO UTC di attribute untuk cross-timezone

## Stack

Next.js 14+ (App Router) · TypeScript strict · PostgreSQL + Prisma · Auth.js v5 · Tailwind + shadcn/ui · Recharts · date-fns-tz · Vitest.

## Cara jalankan

```bash
cp .env.example .env             # replace AUTH_SECRET
docker compose up --build -d --wait # full production-like stack

# Host development alternative:
docker compose up -d postgres
npm ci && npx prisma migrate dev && npm run db:seed && npm run dev
```

Login:

- `viewer@example.com` / `Viewer123!` (VIEWER)
- `manager@example.com` / `Manager123!` (MANAGER)

## Rules

### Timezone & Data

- ❌ JANGAN pakai `new Date()` tanpa kontrol di app logic — timezone eksplisit selalu
- ❌ JANGAN hardcode "Asia/Jakarta" di helper — timezone selalu dari parameter/session
- ❌ JANGAN pakai float untuk amount — int Rupiah
- ❌ JANGAN Math.random tanpa fixed seed di seed script
- ✅ Semua timezone conversion pakai date-fns-tz, bukan Intl langsung
- ✅ Store: UTC di DB. Display: convert ke tz filter/user.

### Query & Filter

- ❌ JANGAN filter data di client — semua di server (Prisma aggregation)
- ❌ JANGAN cache aggressive yang bikin filter gak refresh
- ✅ Filter state HARUS di URL query (deep-linkable + testable via URL)
- ✅ Setiap Server Action ambil userId dari session (bukan client)

### Testability

- ❌ JANGAN skip data-testid — Katalon locator perlu stabil
- ✅ Chart data point: data-value attribute (biar Katalon bisa assert numerik tanpa OCR)
- ✅ Tanggal di UI: data-iso={ISO UTC} + text visible (localized)
- ✅ CSV filename deterministic: `transactions-{from}-{to}-{tz}.csv`

### Architecture (umum)

- ❌ JANGAN akses Prisma langsung dari component — lewat src/server/services/
- ❌ JANGAN pakai `use client` kalau gak butuh interactivity
- ❌ JANGAN endpoint return data sensitif tanpa auth check
- ❌ File > 300 baris → split
- ❌ `any` di TS — kecuali terjustifikasi + comment
- ❌ Server Action / API route tanpa Zod validation

### Scope

- ❌ JANGAN bikin CRUD form untuk data transaksi
- ❌ JANGAN setup Playwright/Selenium/Katalon di repo ini (automation = repo terpisah)

## Personas

| Role    | Bisa                                                                        |
| ------- | --------------------------------------------------------------------------- |
| VIEWER  | Lihat dashboard + transactions. Tidak bisa export CSV. Tidak bisa /revenue. |
| MANAGER | Semua VIEWER + export CSV + /revenue.                                       |

Sidebar: Dashboard, Transactions, Revenue (Manager only — hide di sidebar buat Viewer), Settings.

## Workflow per task

1. Kerjakan HANYA scope prompt
2. Sebelum lapor selesai: `npm run lint && npm run type-check && npm run test && npm run build` hijau
3. Verify acceptance criteria — terutama: filter kombinasi menghasilkan angka konsisten, timezone display berubah tapi ISO konstan
4. Jangan scope creep

## Detail lengkap

Lihat `PROJECT_PLAN.md` (section 4 halaman & fitur, section 5 schema, section 6 seed, section 7 testability hooks, section 9 build prompts).
