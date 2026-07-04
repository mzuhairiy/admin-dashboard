import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { DashboardStats } from "@/server/services/analytics";

interface StatsCardsProps {
  stats: DashboardStats;
  currency: string;
}

export function StatsCards({ stats, currency }: StatsCardsProps) {
  const cards = [
    {
      key: "revenue",
      title: "Total Revenue",
      value: stats.totalRevenue,
      display: formatCurrency(stats.totalRevenue, currency),
    },
    {
      key: "orders",
      title: "Total Orders",
      value: stats.totalOrders,
      display: formatNumber(stats.totalOrders),
    },
    {
      key: "aov",
      title: "Avg Order Value",
      value: stats.avgOrderValue,
      display: formatCurrency(stats.avgOrderValue, currency),
    },
    {
      key: "refund-rate",
      title: "Refund Rate",
      value: stats.refundRate,
      display: formatPercent(stats.refundRate),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key} data-testid={`stats-card-${card.key}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              data-testid={`stats-value-${card.key}`}
              data-value={card.value}
              className="text-2xl font-bold tracking-tight"
            >
              {card.display}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
