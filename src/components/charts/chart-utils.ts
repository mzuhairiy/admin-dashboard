const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Compact axis label from a bucket key ("yyyy-MM-dd" → "5 Jan", "yyyy-MM" → "Jan 2025"). */
export function formatBucketLabel(bucket: string): string {
  const [year, month, day] = bucket.split("-");
  const monthName = MONTH_NAMES[Number(month) - 1] ?? month;
  return day ? `${Number(day)} ${monthName}` : `${monthName} ${year}`;
}

/** Compact number for chart axes: 1.2M / 350K. */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const STATUS_COLORS: Record<string, string> = {
  PAID: "hsl(160 60% 45%)",
  PENDING: "hsl(43 74% 56%)",
  REFUNDED: "hsl(12 76% 61%)",
  CANCELLED: "hsl(215 16% 57%)",
};
