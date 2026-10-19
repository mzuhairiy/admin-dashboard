# Admin Dashboard Project — SUT Plan

> **Fokus dokumen ini:** SUT (Next.js analytics dashboard). Automation plan (Katalon Studio)
> dibuat terpisah nanti saat siap dikerjakan.

---

## 1. Project Brief

### Konteks

Analytics dashboard read-only yang dibangun sebagai **System Under Test** untuk portfolio QA.
Target automation-nya: **Katalon Studio data-driven suite** dengan fokus di chart validation,
CSV export integrity, timezone-aware date filters, dan multi-role scenarios.

### Prinsip desain SUT

- **Read-only** — data lewat seed, bukan CRUD form. Sumber data = "sistem lain" yang disimulasikan seed script.
- **Deterministic** — semua angka bisa dihitung ulang. Seed pakai fixed random seed, timezone konsisten, tidak ada `new Date()` tanpa kontrol.
- **Dynamic behavior via query** — filter/aggregate/timezone bikin data "hidup", bukan CRUD form.
- **Testability first** — tiap chart, table cell, filter, dan tombol export punya testability hook yang stabil (biar Katalon locator gak rapuh).

### Bukan scope (buat kejelasan)

- ❌ CRUD form untuk data transaksi (data via seed)
- ❌ Real-time / websocket update
- ❌ Payment / auth kompleks (auth sederhana aja)
- ❌ Mobile-first design (desktop-first — dashboard analytics biasanya di desktop)

---

## 2. Tech Stack

| Layer         | Choice                                                | Alasan                                                                  |
| ------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Framework     | Next.js 14+ (App Router)                              | Sama dengan project lain, agent zero learning curve                     |
| Language      | TypeScript strict                                     | Konsisten                                                               |
| Database      | PostgreSQL + Prisma                                   | Konsisten                                                               |
| UI            | Tailwind + shadcn/ui                                  | Konsisten                                                               |
| Chart         | Recharts                                              | Populer, testable (SVG-based, punya data-* attribute)                   |
| CSV           | PapaParse (client) atau native (server)               | Deterministic output                                                    |
| Date/Timezone | date-fns + date-fns-tz                                | Explicit timezone handling (bukan native Date)                          |
| Auth          | Auth.js v5 (credentials)                              | Konsisten                                                               |
| Deploy        | Docker Compose lokal; Vercel + Neon/Supabase opsional | Full-stack local SUT reproducible; hosted deployment tetap memungkinkan |

---

## 3. Personas & Roles

| Role        | Bisa apa                                                                       |
| ----------- | ------------------------------------------------------------------------------ |
| **Viewer**  | Lihat semua chart & table. Filter. **TIDAK bisa export CSV** (buat test RBAC). |
| **Manager** | Semua Viewer + **export CSV** + akses halaman Revenue (angka sensitif).        |

Auth sederhana: email + password. Setelah login, redirect ke `/dashboard`. Gak ada sign-up publik — user cuma dari seed.

**Test surface RBAC:**

- Viewer akses tombol Export → hidden atau disabled
- Viewer akses `/revenue` via direct URL → 403
- Manager akses semua → sukses

---

## 4. Halaman & Fitur

### `/dashboard` (Overview) — Viewer + Manager

- **4 stats card** (top): Total Revenue, Total Orders, Avg Order Value, Refund Rate (percentage)
- **Line chart**: Revenue trend (per hari, 30 hari terakhir default; bisa aggregate ke bulanan/tahunan)
- **Bar chart**: Top 10 categories by revenue
- **Pie chart**: Order status distribution (paid, pending, refunded, cancelled)
- **Filter global** (persist di URL query, deep-linkable):
  - Date range (preset: 7d, 30d, 90d, 1y, custom range)
  - Timezone (Asia/Jakarta default, Asia/Singapore, Asia/Tokyo, UTC)
  - Category (multi-select)
  - Status (multi-select)

### `/transactions` (Table view) — Viewer + Manager

- Table transaksi dengan pagination (page size 20/50/100)
- Kolom: Transaction ID, Date (localized ke timezone terpilih), Customer, Category, Amount, Status
- Sort per kolom (ascending/descending)
- Filter sama seperti dashboard (persist di URL)
- **Export CSV button** — Manager only. Export = hasil query saat ini (dengan filter yang aktif), bukan semua data.

### `/revenue` (Revenue detail) — Manager only

- Detail breakdown revenue per periode
- Chart & table dengan angka lebih granular
- Halaman ini buat test RBAC (Viewer di-403 kalau akses langsung)

### `/settings` — Viewer + Manager (own settings)

- Default timezone (persist per user)
- Default currency display (IDR / USD, cuma display format, gak convert)
- Ini satu-satunya form submission — bikin Katalon ada write action buat di-test

### `/sign-in` — Public

- Email + password
- Error inline di DOM

---

## 5. Data Model (Prisma Schema)

```prisma
enum UserRole {
  VIEWER
  MANAGER
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String   // bcrypt hashed
  name         String
  role         UserRole @default(VIEWER)
  timezone     String   @default("Asia/Jakarta")
  currency     String   @default("IDR")
  createdAt    DateTime @default(now())

  accounts     Account[]
  sessions     Session[]
}

// Auth.js tables (Account, Session, VerificationToken) — sama pattern spt project lain

enum TransactionStatus {
  PAID
  PENDING
  REFUNDED
  CANCELLED
}

model Category {
  id           String        @id @default(cuid())
  name         String        @unique
  slug         String        @unique
  transactions Transaction[]
}

model Transaction {
  id           String            @id @default(cuid())
  externalId   String            @unique  // "TX-2025-000001" (deterministic)
  amount       Int               // dalam Rupiah (int, hindari float)
  customerName String
  customerCity String            // buat context timezone-ish
  status       TransactionStatus
  categoryId   String
  category     Category          @relation(fields: [categoryId], references: [id])
  createdAt    DateTime          // ini yang jadi basis semua filter — WAJIB deterministic dari seed

  @@index([createdAt])
  @@index([categoryId])
  @@index([status])
}
```

---

## 6. Seed Data — Deterministic & Variatif

### Prinsip

- Fixed random seed (e.g. `faker.seed(12345)`) — sama tiap run
- **Rentang waktu: 365 hari terakhir** dari tanggal "now" yang di-inject (bukan `new Date()` — set jadi tanggal tetap untuk deterministic testing, e.g. `2026-01-01`)
- **Volume: 5.000 transaksi** — cukup buat pagination, aggregation, chart yang keliatan hidup
- **Distribusi realistis:**
  - Weekend (Sat-Sun): ~1.5x weekday
  - Ada 2-3 "spike day" (event sale) dengan volume 3-5x normal
  - Trend meningkat tipis month-over-month (5% growth)
- **Kategori: 10** — Electronics, Fashion, Food & Beverage, Home & Living, Health & Beauty, Sports, Books, Toys, Automotive, Other
- **Status distribution:** 85% PAID, 5% PENDING, 7% REFUNDED, 3% CANCELLED
- **Amount:** log-normal distribution (Rp 50.000 – Rp 5.000.000, median ~Rp 350.000)
- **Customer city:** Jakarta, Surabaya, Bandung, Medan, Singapore, Tokyo (buat variasi timezone context)
- **externalId:** sequential (`TX-2025-000001` → `TX-2025-005000`)

### User seed

| Email                 | Password      | Role    |
| --------------------- | ------------- | ------- |
| `viewer@example.com`  | `Viewer123!`  | VIEWER  |
| `manager@example.com` | `Manager123!` | MANAGER |

### Idempotent

Seed harus bisa di-run 2x tanpa duplikat (`prisma migrate reset --force` untuk fresh state).

---

## 7. Testability Hooks (kontrak ke Katalon)

Karena Katalon punya locator strategy sendiri (bisa CSS/XPath/attribute), gue tetap konsisten pakai
`data-testid` — sama seperti project lain. Konsistensi lintas project = 1 mental model.

### Konvensi

- ✅ **`data-testid` stabil** di elemen interaktif utama (button, input, filter, row, chart)
- ✅ **Chart data attribute** — tiap chart punya `data-testid="chart-revenue-trend"`, dan tiap data point punya `data-value="..."` (dari recharts custom prop) biar Katalon bisa assert nilai numerik tanpa OCR/pixel
- ✅ **Table row** punya `data-testid="transaction-row"` + `data-tx-id` (buat identifikasi)
- ✅ **Filter state di URL** (deep-linkable + testable)
- ✅ **CSV export** — file yang di-download namanya deterministic (`transactions-{startDate}-{endDate}-{timezone}.csv`)
- ✅ **Timezone display** — semua tanggal yang ditampilkan wajib punya `data-iso="2026-01-15T10:30:00Z"` (ISO UTC di attribute) + text visible (localized). Biar Katalon bisa assert ISO UTC-nya untuk cross-timezone testing.
- ✅ **Loading & empty state** eksplisit dengan testid

### Testid penting

**Auth:** `sign-in-form` `sign-in-email` `sign-in-password` `sign-in-submit` `sign-in-error`

**Layout:** `sidebar` `sidebar-dashboard` `sidebar-transactions` `sidebar-revenue` `sidebar-settings` · `user-menu-trigger` `menu-sign-out`

**Filter (global):** `filter-bar` `filter-date-range` `date-preset-7d` `date-preset-30d` `date-preset-90d` `date-preset-1y` `date-custom-start` `date-custom-end` · `filter-timezone` · `filter-category` `filter-category-{slug}` · `filter-status` `filter-status-{status}` · `filter-clear`

**Dashboard:** `dashboard-page` · `stats-card-revenue` `stats-value-revenue` · `stats-card-orders` `stats-value-orders` · `stats-card-aov` `stats-value-aov` · `stats-card-refund-rate` `stats-value-refund-rate` · `chart-revenue-trend` · `chart-top-categories` · `chart-order-status`

**Transactions:** `transactions-page` · `transactions-table` · `transaction-row` · `column-{id,date,customer,category,amount,status}` · `sort-{column}` · `pagination` `page-size-select` · `export-csv-button` (Manager only) · `empty-state`

**Revenue (Manager only):** `revenue-page` · `revenue-breakdown-chart` · `revenue-detail-table`

**Settings:** `settings-page` · `timezone-select` · `currency-select` · `settings-save-button` · `settings-saved-toast`

**RBAC:** `forbidden-page`

---

## 8. Struktur Folder

```
admin-dashboard/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts              # deterministic seed (fixed random, fixed "now")
├── src/
│   ├── app/
│   │   ├── (auth)/sign-in/
│   │   ├── (dashboard)/     # protected shell (sidebar layout)
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── revenue/     # Manager only
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   └── export/csv/  # CSV export endpoint (Manager only)
│   │   ├── forbidden/
│   │   ├── layout.tsx
│   │   └── page.tsx         # redirect to /dashboard atau /sign-in
│   ├── components/
│   │   ├── ui/              # shadcn
│   │   ├── shared/          # workspace-shell (sidebar, topbar)
│   │   ├── charts/          # RevenueTrendChart, TopCategoriesChart, OrderStatusChart
│   │   └── filters/         # DateRangeFilter, TimezoneFilter, CategoryFilter, StatusFilter
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── timezone.ts      # helper: formatDate(iso, tz), currentInTz
│   │   └── csv.ts           # export helper (deterministic ordering)
│   ├── server/
│   │   ├── actions/         # updateSettingsAction
│   │   └── services/        # analytics.ts (query aggregation), transaction.ts
│   ├── schemas/             # Zod
│   └── middleware.ts        # RBAC check
├── tests/                   # Vitest white-box only
│   ├── unit/
│   │   ├── timezone.test.ts       # convert & format lintas timezone
│   │   ├── csv-export.test.ts     # CSV integrity
│   │   ├── analytics.test.ts      # aggregation logic
│   │   └── rbac.test.ts
│   └── components/                # smoke render
├── docker-compose.yml       # local Postgres
├── CLAUDE.md
├── PROJECT_PLAN.md          # file ini
└── README.md
```

---

## 9. Build Prompts (Fase SUT)

### Prompt 1 — Project Scaffold

```
Scaffold Next.js 14+ project untuk analytics dashboard:

1. Next.js dengan App Router, TypeScript strict, Tailwind, ESLint
2. Dependencies:
   - Prisma + @prisma/client
   - next-auth@beta + @auth/prisma-adapter
   - zod, react-hook-form, @hookform/resolvers
   - lucide-react, clsx, tailwind-merge, class-variance-authority
   - recharts (chart)
   - date-fns, date-fns-tz (timezone-aware)
   - papaparse (CSV parsing/generation)
   - @faker-js/faker (seed)
3. shadcn/ui init (style default, base color slate)
4. shadcn components: button, input, label, card, dialog, dropdown-menu, avatar,
   badge, separator, skeleton, sonner, select, table, tabs, checkbox, calendar, popover
5. Vitest + Prettier + scripts: lint, type-check, test, test:watch
6. Folder structure sesuai PROJECT_PLAN.md section 8
7. docker-compose.yml (Postgres 16)
8. .env.example (DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL)
9. README.md dengan setup instructions

INGAT: repo ini SUT untuk Katalon automation di repo terpisah.
JANGAN setup Playwright/Selenium/Katalon di sini.

Verifikasi: npm run lint + type-check + test hijau, npm run dev jalan.
```

### Prompt 2 — Schema + Seed

```
Setup database layer:

1. prisma/schema.prisma sesuai PROJECT_PLAN.md section 5:
   - User (VIEWER/MANAGER), timezone, currency preference
   - Auth.js tables (Account, Session, VerificationToken)
   - Category
   - Transaction (deterministic externalId, createdAt indexed)
2. src/lib/db.ts — Prisma singleton
3. Migration awal (npx prisma migrate dev --name init)
4. prisma/seed.ts — DETERMINISTIC:
   - Set faker seed (12345), define const FIXED_NOW = new Date('2026-01-01T00:00:00Z')
   - 2 user (viewer + manager) dengan password hashed
   - 10 categories
   - 5.000 transactions dalam rentang 365 hari sebelum FIXED_NOW
   - Distribusi sesuai PROJECT_PLAN section 6 (weekend spike, growth trend, status ratio, log-normal amount)
   - externalId sequential TX-2025-000001..005000
   - Semua createdAt PASTI deterministic (bukan Date.now())
5. package.json script: db:seed
6. Verify: npx prisma studio menampilkan data, aggregate query manual sesuai ekspektasi

Verifikasi: seed 2x tidak duplikat (idempotent), count = 5.000 tetap.
```

### Prompt 3 — Auth + RBAC + Shell

```
Setup auth + shell layout + RBAC:

1. Auth.js v5 credentials (email + password bcrypt), session JWT
2. src/lib/auth.ts + api/auth/[...nextauth]/route.ts
3. Middleware:
   - /dashboard, /transactions, /revenue, /settings → wajib login
   - /revenue → Manager only, kalau bukan → /forbidden
   - Session di setiap Server Action juga di-check (defense in depth)
4. Helper requireRole() + getRoleHomePath() + unit test
5. /sign-in page (form dengan validation Zod, error inline)
6. Sign-out action
7. Workspace shell (src/components/shared/workspace-shell.tsx):
   - Sidebar kiri: Dashboard, Transactions, Revenue (Manager only — hide di sidebar kalau Viewer), Settings
   - Topbar: breadcrumb + avatar dropdown (Settings, Sign Out)
   - Style: bg navy gelap sidebar, konsisten dengan project lain
8. /forbidden page dengan testid + link kembali ke /dashboard
9. Redirect setelah sign-in: role apapun → /dashboard (satu landing untuk kedua role)

Testability: data-testid pada sidebar nav, user menu, sign-in form, forbidden page.

Verifikasi: viewer login → /dashboard bisa, /revenue → 403; manager login → semua bisa.
```

### Prompt 4 — Dashboard Overview

```
Build /dashboard page:

1. Global filter bar (di atas semua chart):
   - Date range (preset 7d/30d/90d/1y/custom) — default 30d
   - Timezone select — default user.timezone (dari session)
   - Category multi-select
   - Status multi-select
   - Tombol Clear
   - STATE DI URL QUERY (?from=&to=&tz=&category=&status=)
2. Service layer (src/server/services/analytics.ts):
   - getDashboardStats(filters) — return { totalRevenue, totalOrders, avgOrderValue, refundRate }
   - getRevenueTrend(filters) — array {date, revenue} — aggregation per hari (atau otomatis per bulan kalau range >90d)
   - getTopCategories(filters, limit=10) — array {categoryName, revenue}
   - getStatusDistribution(filters) — array {status, count}
   - Semua query pakai Prisma aggregation (groupBy, sum, count)
   - Semua filter tanggal di-convert ke UTC di server (input dari URL bisa dalam timezone user)
3. 4 stats card (top): Total Revenue (IDR format), Total Orders, Avg Order Value, Refund Rate (%)
4. Chart (recharts):
   - Line chart revenue trend — pakai <ResponsiveContainer>, x-axis label sesuai timezone
   - Bar chart top 10 categories
   - Pie chart order status
5. Chart hooks: setiap data point punya data-value attribute (via recharts Cell custom atau data-attribute pattern)
6. Empty state kalau filter menghasilkan 0 hasil

Testability: data-testid sesuai section 7 (chart-*, stats-*, filter-*).

Verifikasi: filter kombinasi menghasilkan angka konsisten dengan query manual di prisma studio;
URL state persist saat refresh; stats card menunjukkan angka yang benar untuk seed data.
```

### Prompt 5 — Transactions Table + CSV Export

```
Build /transactions page + CSV export:

1. Table transaksi:
   - Kolom: externalId, createdAt (localized to filter timezone), customerName, category, amount (IDR), status (badge)
   - Sort per kolom (klik header — asc/desc toggle)
   - Pagination (page size 20/50/100 select)
   - Filter sama dengan dashboard (share filter bar component)
   - URL state: ?page=&pageSize=&sort=&order= + filter yang sama
2. Setiap row data-testid="transaction-row" + data-tx-id={externalId}
3. Setiap cell tanggal punya data-iso={ISO UTC} + text visible (localized ke tz filter)
4. Empty state kalau 0 hasil
5. CSV Export (Manager only):
   - Tombol "Export CSV" — DISABLED / HIDDEN untuk Viewer
   - Klik → panggil /api/export/csv?<same filters>
   - Route handler:
     - RBAC check (Manager only, kalau Viewer → 403)
     - Query dengan filter yang sama (bukan re-query dari DB semua data)
     - Generate CSV: header row: Transaction ID, Date (ISO UTC), Date (Local), Customer, Category, Amount, Status
     - Filename: transactions-{fromDate}-{toDate}-{timezone}.csv
     - Content-Disposition: attachment
     - Content-Type: text/csv
   - CSV integrity: baris ke-N di CSV = row ke-N di table (sort urutan sama)
6. Service layer (src/server/services/transaction.ts + src/lib/csv.ts):
   - Pisahkan logic query dari format CSV supaya bisa unit-tested
7. Unit test:
   - csv-export.test.ts: generate CSV dari 5 transaksi mock, verify header + urutan + escape (koma dalam nama, dll)
   - RBAC endpoint: viewer → 403, manager → 200

Testability: data-testid sesuai section 7.

Verifikasi: filter + sort + export → CSV isinya == table view; Viewer tidak lihat tombol Export;
direct hit /api/export/csv sebagai Viewer → 403.
```

### Prompt 6 — Revenue Detail + Settings + Polish

```
Final piece SUT:

1. /revenue page (Manager only):
   - Breakdown revenue lebih granular (per bulan detail, per kategori matrix)
   - 1-2 chart tambahan (misal stacked bar per bulan per kategori)
   - Table detail dengan drill-down mock
2. /settings page:
   - Form: timezone select (list ~10 timezone umum) + currency select (IDR, USD, SGD — cuma display format, bukan konversi)
   - Server Action updateSettingsAction — validasi Zod, ambil userId dari session
   - Toast success setelah save (data-testid="settings-saved-toast")
   - Setelah save, timezone default di filter bar juga update
3. Polish:
   - Metadata title semua page
   - Empty states informatif
   - Loading skeleton
   - Format Rupiah helper (formatCurrency(amount, currency)) + unit test
   - Format tanggal per timezone helper + unit test (test lintas timezone: Jakarta vs UTC vs Tokyo untuk tanggal yang sama menghasilkan display yang benar)
   - 404 page on-brand
4. QA-HANDOFF.md — draft handoff doc buat Katalon nanti (sama pattern dengan CoursePlatform)
5. ADR docs/adr/0001-tech-stack.md

Acceptance criteria overall:
- ✅ Viewer login → dashboard + transactions bisa; export button tidak muncul; /revenue → 403
- ✅ Manager login → semua bisa; export CSV → file terunduh dengan filter yang benar
- ✅ Filter kombinasi (date + timezone + category + status) menghasilkan angka konsisten
- ✅ Timezone berubah → tanggal display di table & chart berubah, tapi ISO UTC di data-iso konstan
- ✅ Semua page responsive (walau desktop-first)
- ✅ lint + type-check + test + build hijau
```

---

## 10. Anti-Pattern SUT

- ❌ JANGAN pakai `new Date()` tanpa kontrol di app logic — semua timezone-aware
- ❌ JANGAN hardcode "Asia/Jakarta" di helper — timezone selalu dari parameter/session
- ❌ JANGAN pakai float untuk amount — pakai int (Rupiah cent-less)
- ❌ JANGAN filter data di client — semua aggregation di server (query DB)
- ❌ JANGAN cache aggressive di layer yang bikin filter/query gak refresh
- ❌ JANGAN bikin CRUD form buat data transaksi
- ❌ JANGAN skip data-testid — Katalon perlu locator stabil
- ❌ JANGAN Math.random tanpa fixed seed di seed script

Aturan koding umum (file size, service layer, Zod validation, dll) → `CLAUDE.md`.

---

## 11. Status implementasi dan tindak lanjut (review 2026-10-19)

Enam fase SUT sudah diimplementasikan: scaffold, schema/seed, auth/RBAC/shell,
dashboard, transactions/CSV, serta revenue/settings/polish. `QA-HANDOFF.md` sudah
tersedia sebagai kontrak automation; validasi end-to-end Katalon tetap di repo terpisah.

Perbaikan correctness dari review ini:

- Revenue trend dan top categories menghormati status filter (PAID di-intersect
  dengan filter, bukan menggantikan filter).
- Calendar-date arithmetic tidak tergantung timezone server saat DST berubah.
- Pilihan 30D eksplisit di URL agar tidak kembali ke default 1y pada Revenue.
- Preset invalid tidak membuang filter lain; repeated query params memakai nilai
  pertama secara konsisten pada page dan CSV.
- Pagination di luar hasil di-clamp ke halaman terakhir sebelum query database.
- Callback sign-in dibatasi ke path lokal dan deep link tetap dipertahankan.
- Tooltip chart mengikuti currency preference, tanpa konversi nominal.

Klarifikasi scope aktual: settings mendukung 10 timezone dan IDR/USD/SGD; trend
otomatis harian (≤90 hari) atau bulanan (>90 hari), belum ada selector agregasi tahunan.
Viewer yang membuka `/revenue` diarahkan ke `/forbidden`; HTTP 403 berlaku pada API
export. Bucketing timezone di JS untuk volume seed 5.000 baris adalah trade-off yang
diterima (ADR 0001), bukan pekerjaan SQL migration yang tertunda.

Tindak lanjut di luar perubahan correctness ini:

- Katalon Studio automation plan (repo terpisah `admin-dashboard-automation`)
- Cross-project QA portfolio doc
- Selector agregasi tahunan/manual dari brief awal, jika dibutuhkan di iterasi fitur
  berikutnya; belum termasuk kontrak automation saat ini.
- Upgrade mayor Next.js 14 → versi supported terbaru. Audit 2026-10-20 masih menemukan
  advisory pada Next.js yang hanya memiliki perbaikan melalui upgrade mayor; Auth.js
  sudah dipatch ke `5.0.0-beta.32`/`@auth/core` `0.41.3` pada review containerisasi.

## 12. Hubungan ke Portfolio QA

| Proyek                    | SUT stack         | Automation             | Skill baru vs proyek lain                                 |
| ------------------------- | ----------------- | ---------------------- | --------------------------------------------------------- |
| Petpals                   | Next.js           | Playwright             | —                                                         |
| CoursePlatform            | Next.js           | Playwright BDD         | BDD/Gherkin                                               |
| CMS                       | Strapi (built-in) | Selenium Java + Allure | Java, SUT bukan milik sendiri                             |
| **Admin Dashboard (ini)** | **Next.js**       | **Katalon Studio**     | **Katalon (low-code), data-driven, timezone/CSV testing** |
| Mobile E-Commerce         | —                 | Appium                 | Mobile                                                    |
| Finance App               | —                 | Maestro                | React Native                                              |

**Yang membedakan proyek ini:** test surface fokus di **data correctness** (chart nilai benar, CSV integrity,
timezone conversion konsisten) — beda dari proyek lain yang lebih fokus di flow user. Ini
data-driven testing paradise buat Katalon.
