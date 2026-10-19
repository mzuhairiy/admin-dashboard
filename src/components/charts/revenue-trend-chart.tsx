"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/server/services/analytics";
import { formatCurrency } from "@/lib/format";
import { formatBucketLabel, formatCompact } from "@/components/charts/chart-utils";

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: TrendPoint;
}

/** Controlled SVG dot so every data point carries data-value / data-date hooks. */
function TrendDot({ cx, cy, payload }: DotProps) {
  if (cx === undefined || cy === undefined || !payload) return <g />;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={2.5}
      fill="hsl(217 91% 50%)"
      data-testid="chart-revenue-trend-point"
      data-date={payload.date}
      data-value={payload.revenue}
    />
  );
}

export function RevenueTrendChart({ data, currency }: { data: TrendPoint[]; currency?: string }) {
  return (
    <div data-testid="chart-revenue-trend" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tickFormatter={formatBucketLabel}
            tick={{ fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} width={56} />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value), currency), "Revenue"]}
            labelFormatter={(label) => formatBucketLabel(String(label))}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="hsl(217 91% 50%)"
            strokeWidth={2}
            dot={<TrendDot />}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
