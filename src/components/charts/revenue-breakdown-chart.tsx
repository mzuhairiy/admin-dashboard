"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenueBreakdown } from "@/server/services/revenue";
import { CHART_COLORS, formatBucketLabel, formatCompact } from "@/components/charts/chart-utils";
import { MonetaryChartTooltip } from "@/components/charts/monetary-chart-tooltip";

interface StackShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: { month: string } & Record<string, number | string>;
}

function makeStackShape(categoryName: string) {
  function StackSegment({ x, y, width, height, fill, payload }: StackShapeProps) {
    if (x === undefined || y === undefined || !width || height === undefined || !payload) {
      return <g />;
    }
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={Math.max(height, 0)}
        fill={fill}
        data-testid="revenue-breakdown-segment"
        data-month={payload.month}
        data-category={categoryName}
        data-value={payload[categoryName] ?? 0}
      />
    );
  }
  return StackSegment;
}

export function RevenueBreakdownChart({
  breakdown,
  currency,
}: {
  breakdown: RevenueBreakdown;
  currency?: string;
}) {
  const data = breakdown.months.map((month) => ({
    month: month.month,
    ...month.byCategory,
  }));

  return (
    <div data-testid="revenue-breakdown-chart" className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tickFormatter={formatBucketLabel} tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} width={56} />
          <Tooltip
            content={(props) => (
              <MonetaryChartTooltip
                active={props.active}
                payload={props.payload}
                label={props.label}
                currency={currency}
                labelFormatter={(label) => formatBucketLabel(label)}
              />
            )}
          />
          <Legend />
          {breakdown.categoryNames.map((categoryName, index) => (
            <Bar
              key={categoryName}
              dataKey={categoryName}
              stackId="revenue"
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              shape={makeStackShape(categoryName)}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
