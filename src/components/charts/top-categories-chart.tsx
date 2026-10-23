"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoryRevenue } from "@/server/services/analytics";
import { formatCompact } from "@/components/charts/chart-utils";
import { MonetaryChartTooltip } from "@/components/charts/monetary-chart-tooltip";

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: CategoryRevenue;
}

/** Controlled SVG bar so every bar carries data-value / data-category hooks. */
function CategoryBar({ x, y, width, height, payload }: BarShapeProps) {
  if (x === undefined || y === undefined || !width || height === undefined || !payload) {
    return <g />;
  }
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={Math.max(height, 0)}
      rx={3}
      fill="hsl(217 91% 55%)"
      data-testid="chart-top-categories-bar"
      data-category={payload.categorySlug}
      data-value={payload.revenue}
    />
  );
}

export function TopCategoriesChart({
  data,
  currency,
}: {
  data: CategoryRevenue[];
  currency?: string;
}) {
  return (
    <div data-testid="chart-top-categories" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" tickFormatter={formatCompact} tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="categoryName"
            width={110}
            tick={{ fontSize: 12 }}
            interval={0}
          />
          <Tooltip
            content={(props) => (
              <MonetaryChartTooltip
                active={props.active}
                payload={props.payload}
                label={props.label}
                currency={currency}
                nameFormatter={() => "Revenue"}
              />
            )}
          />
          <Bar dataKey="revenue" shape={<CategoryBar />} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
