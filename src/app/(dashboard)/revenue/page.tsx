import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/rbac";
import { resolveFilters } from "@/schemas/filters";
import { getMonthlyCategoryRevenue } from "@/server/services/revenue";
import { listCategories } from "@/server/services/category";
import { getUserPrefs } from "@/server/services/user";
import { FilterBar } from "@/components/filters/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { RevenueBreakdownChart } from "@/components/charts/revenue-breakdown-chart";
import { RevenueDetailTable } from "./revenue-detail-table";

export const metadata: Metadata = {
  title: "Revenue",
};

interface RevenuePageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function RevenuePage({ searchParams }: RevenuePageProps) {
  const session = await requireRole("MANAGER"); // defense in depth — middleware also guards this path
  const prefs = await getUserPrefs(session.user.id);

  // Monthly breakdown reads better over a longer window — default to 1y here.
  const raw = { ...searchParams };
  if (!raw.preset && !raw.from && !raw.to) raw.preset = "1y";
  const filters = resolveFilters(raw, prefs.timezone);

  const [categories, breakdown] = await Promise.all([
    listCategories(),
    getMonthlyCategoryRevenue(filters),
  ]);

  return (
    <div data-testid="revenue-page" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manager-only detail · {filters.fromDate} – {filters.toDate} · {filters.tz}
        </p>
      </div>

      <FilterBar filters={filters} categories={categories} />

      {breakdown.months.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Revenue by Category (PAID)</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueBreakdownChart breakdown={breakdown} currency={prefs.currency} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueDetailTable months={breakdown.months} currency={prefs.currency} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
