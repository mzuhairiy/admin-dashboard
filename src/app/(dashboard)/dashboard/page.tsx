import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/rbac";
import { resolveFilters } from "@/schemas/filters";
import {
  getDashboardStats,
  getRevenueTrend,
  getStatusDistribution,
  getTopCategories,
} from "@/server/services/analytics";
import { listCategories } from "@/server/services/category";
import { getUserPrefs } from "@/server/services/user";
import { FilterBar } from "@/components/filters/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { RevenueTrendChart } from "@/components/charts/revenue-trend-chart";
import { TopCategoriesChart } from "@/components/charts/top-categories-chart";
import { OrderStatusChart } from "@/components/charts/order-status-chart";
import { StatsCards } from "./stats-cards";

export const metadata: Metadata = {
  title: "Dashboard",
};

interface DashboardPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await requireSession();
  const prefs = await getUserPrefs(session.user.id);
  const filters = resolveFilters(searchParams, prefs.timezone);

  const [categories, stats, trend, topCategories, statusDistribution] = await Promise.all([
    listCategories(),
    getDashboardStats(filters),
    getRevenueTrend(filters),
    getTopCategories(filters),
    getStatusDistribution(filters),
  ]);

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filters.fromDate} – {filters.toDate} · {filters.tz}
        </p>
      </div>

      <FilterBar filters={filters} categories={categories} />

      {stats.totalOrders === 0 ? (
        <EmptyState />
      ) : (
        <>
          <StatsCards stats={stats} currency={prefs.currency} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueTrendChart data={trend} currency={prefs.currency} />
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 10 Categories by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <TopCategoriesChart data={topCategories} currency={prefs.currency} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusChart data={statusDistribution} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
