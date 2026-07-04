# QA Handoff — Admin Dashboard (SUT)

Handoff notes for the Katalon Studio automation suite (separate repo:
`admin-dashboard-automation`). This SUT is optimized for **data-correctness testing**:
chart values, CSV integrity, timezone conversion, and RBAC.

## 1. Running the SUT

```bash
docker compose up -d --wait   # Postgres on localhost:5434
cp .env.example .env          # set AUTH_SECRET (openssl rand -base64 32)
npm install
npx prisma migrate dev
npm run db:seed
npm run dev                   # http://localhost:3000
```

## 2. Test accounts

| Email                 | Password      | Role    | Can                                        |
| --------------------- | ------------- | ------- | ------------------------------------------ |
| `viewer@example.com`  | `Viewer123!`  | VIEWER  | Dashboard, Transactions, Settings          |
| `manager@example.com` | `Manager123!` | MANAGER | Everything Viewer can + CSV export + `/revenue` |

## 3. Deterministic data facts (safe to assert)

The seed is fully deterministic (faker seed `12345`, fixed `FIXED_NOW = 2026-01-01T00:00:00Z`).
Re-seeding always produces byte-identical data.

- **5,000 transactions**, `TX-2025-000001` … `TX-2025-005000`, ordered by `createdAt`.
- Date range: **2025-01-01 → 2025-12-31 (UTC)** (365 days before FIXED_NOW).
- Exact status counts: **PAID 4,250 · PENDING 250 · REFUNDED 350 · CANCELLED 150**
  (85% / 5% / 7% / 3%).
- 10 categories: Electronics, Fashion, Food & Beverage, Home & Living, Health & Beauty,
  Sports, Books, Toys, Automotive, Other.
- Amounts: integer Rupiah, Rp 50.000 – Rp 5.000.000, median ≈ Rp 350.000.
- Volume shape: weekends ≈ 1.5× weekdays, ~5% month-over-month growth, spike days
  (~4×) on **2025-06-06, 2025-11-11, 2025-12-12**.
- Reference values for default UTC 30-day window (2025-12-03 → 2026-01-01, no filters):
  totalRevenue `225641000`, totalOrders `544`, avgOrderValue `480087`, refundRate `6.1`.

“Today” in the app is always **FIXED_NOW** (not the real clock), so date presets
(7d/30d/90d/1y) are stable forever.

## 4. URL state contract (deep-linkable)

All filter/table state lives in the query string — a URL fully reproduces a view:

```
/dashboard?preset=90d&tz=Asia/Tokyo&category=electronics,fashion&status=PAID,REFUNDED
/transactions?page=2&pageSize=50&sort=amount&order=desc&tz=UTC
```

| Param      | Values                                             | Default        |
| ---------- | -------------------------------------------------- | -------------- |
| `preset`   | `7d` `30d` `90d` `1y` `custom`                     | `30d`          |
| `from`/`to`| `yyyy-MM-dd` (only with `preset=custom`)           | —              |
| `tz`       | `Asia/Jakarta` `Asia/Singapore` `Asia/Tokyo` `UTC` | user's setting |
| `category` | comma-separated slugs                              | all            |
| `status`   | comma-separated `PAID,PENDING,REFUNDED,CANCELLED`  | all            |
| `page`     | integer ≥ 1                                        | `1`            |
| `pageSize` | `20` `50` `100`                                    | `20`           |
| `sort`     | `id` `date` `customer` `category` `amount` `status`| `date`         |
| `order`    | `asc` `desc`                                       | `desc`         |

Invalid values fall back to defaults (no error page). Date presets are interpreted as
calendar days **in the selected timezone**, then converted to UTC server-side.

## 5. Testability hooks

### Locator convention
Stable `data-testid` on all interactive/assertable elements. Numeric assertions never
need OCR — read `data-value`. Date assertions never need parsing localized text — read
`data-iso` (always ISO-8601 UTC).

### Auth
`sign-in-form` `sign-in-email` `sign-in-password` `sign-in-submit` `sign-in-error`

### Layout
`sidebar` `sidebar-dashboard` `sidebar-transactions` `sidebar-revenue` (Manager only —
absent from DOM for Viewer) `sidebar-settings` · `user-menu-trigger` `menu-settings`
`menu-sign-out`

### Filter bar (dashboard + transactions + revenue)
`filter-bar` `filter-date-range` `date-preset-7d|30d|90d|1y` `date-custom-start`
`date-custom-end` · `filter-timezone` (+ `filter-timezone-{tz-slug}` options) ·
`filter-category` + `filter-category-{slug}` · `filter-status` +
`filter-status-{paid|pending|refunded|cancelled}` · `filter-clear`

### Dashboard
`dashboard-page` · `stats-card-{revenue|orders|aov|refund-rate}` ·
`stats-value-{revenue|orders|aov|refund-rate}` (**with `data-value`** = raw number) ·
`chart-revenue-trend` + `chart-revenue-trend-point` (`data-date`, `data-value`) ·
`chart-top-categories` + `chart-top-categories-bar` (`data-category`, `data-value`) ·
`chart-order-status` + `chart-order-status-slice` (`data-status`, `data-value`)

### Transactions
`transactions-page` `transactions-table` `transaction-row` (+`data-tx-id`) ·
`column-{id|date|customer|category|amount|status}` (date cell has `data-iso`; amount
cell has `data-value`) · `sort-{column}` · `pagination` `pagination-prev`
`pagination-next` `pagination-info` `pagination-total` `page-size-select` ·
`export-csv-button` (**absent for Viewer**) · `empty-state`

### Revenue (Manager only)
`revenue-page` · `revenue-breakdown-chart` + `revenue-breakdown-segment` (`data-month`,
`data-category`, `data-value`) · `revenue-detail-table` `revenue-month-row`
(`data-month`) `revenue-month-orders` `revenue-month-total` (both `data-value`) ·
`revenue-drilldown-{yyyy-MM}` → expands `revenue-category-row` + `revenue-category-value`

### Settings
`settings-page` `settings-form` `timezone-select` (+ `timezone-option-{slug}`)
`currency-select` (+ `currency-option-{idr|usd|sgd}`) `settings-save-button`
`settings-saved-toast` `settings-error`

### Misc
`forbidden-page` `forbidden-back-link` · `not-found-page` · `loading-skeleton` ·
`empty-state`

## 6. CSV export contract (Manager only)

- Endpoint: `GET /api/export/csv?<same query params as /transactions>`
- RBAC: no session → **401**; VIEWER → **403**; MANAGER → **200**.
- Header row: `Transaction ID,Date (ISO UTC),Date (Local),Customer,Category,Amount,Status`
- Row N of the CSV == row N of the table for the same query (same sort + tie-break by
  `externalId`), unpaginated (all matching rows).
- Amounts are raw integers; local date column uses the `tz` query param.
- Filename is deterministic: `transactions-{from}-{to}-{tz}.csv` with `/` → `-`
  (e.g. `transactions-2025-12-03-2026-01-01-Asia-Jakarta.csv`).
- RFC 4180 escaping (commas/quotes in customer names).

## 7. Key scenarios to automate

1. **RBAC**: Viewer → no `sidebar-revenue`, no `export-csv-button`, `/revenue` deep link
   → `forbidden-page`, `/api/export/csv` → 403. Manager → all allowed.
2. **Chart correctness**: assert `data-value` totals equal `stats-value-*` values and
   the deterministic reference numbers (section 3).
3. **Timezone invariance**: switch `tz` — visible dates change, `data-iso` stays
   constant; boundary transactions move between days/months.
4. **Filter consistency**: any filter combination → stats, chart sums, table total, and
   CSV row count all agree.
5. **CSV integrity**: download with active filters → compare rows to table.
6. **URL deep links**: paste a filtered URL in a fresh session → identical state after
   sign-in redirect.
7. **Settings write path**: change timezone → toast appears → filter bar default
   timezone updates on next page load.

## 8. Notes & gotchas

- Sessions are JWT cookies (Auth.js v5). Programmatic login: `GET /api/auth/csrf` then
  POST `csrfToken`, `email`, `password` to `/api/auth/callback/credentials`.
- Timezone/currency changes in Settings affect **defaults**; an explicit `tz` query
  param always wins.
- Charts are client-rendered SVG — wait for `chart-*` testids before asserting points.
- The only write surface is Settings; everything else is read-only by design.
