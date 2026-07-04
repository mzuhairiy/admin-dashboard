"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { StatusCount } from "@/server/services/analytics";
import { STATUS_COLORS } from "@/components/charts/chart-utils";

interface SliceLabelProps {
  x?: number;
  y?: number;
  textAnchor?: string;
  payload?: StatusCount;
  percent?: number;
}

/** Controlled SVG label so every slice carries data-value / data-status hooks. */
function SliceLabel({ x, y, textAnchor, payload, percent }: SliceLabelProps) {
  if (x === undefined || y === undefined || !payload) return <g />;
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor as "start" | "middle" | "end" | undefined}
      fill="hsl(var(--foreground))"
      fontSize={12}
      data-testid="chart-order-status-slice"
      data-status={payload.status}
      data-value={payload.count}
    >
      {`${payload.status} ${(Number(percent ?? 0) * 100).toFixed(1)}%`}
    </text>
  );
}

export function OrderStatusChart({ data }: { data: StatusCount[] }) {
  return (
    <div data-testid="chart-order-status" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={88}
            label={<SliceLabel />}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "hsl(var(--muted))"} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [String(value), String(name)]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
