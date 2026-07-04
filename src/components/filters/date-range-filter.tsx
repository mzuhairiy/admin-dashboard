"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DatePreset } from "@/schemas/filters";
import { useFilterParams } from "@/components/filters/use-filter-params";

const PRESETS: Array<{ value: Exclude<DatePreset, "custom">; label: string }> = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1Y" },
];

interface DateRangeFilterProps {
  preset: DatePreset;
  fromDate: string;
  toDate: string;
}

export function DateRangeFilter({ preset, fromDate, toDate }: DateRangeFilterProps) {
  const { setParams } = useFilterParams();

  const selectPreset = (value: Exclude<DatePreset, "custom">) => {
    setParams({ preset: value === "30d" ? null : value, from: null, to: null });
  };

  const setCustomRange = (nextFrom: string, nextTo: string) => {
    if (!nextFrom || !nextTo) return;
    setParams({ preset: "custom", from: nextFrom, to: nextTo });
  };

  return (
    <div data-testid="filter-date-range" className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-md border bg-white p-0.5">
        {PRESETS.map((p) => (
          <Button
            key={p.value}
            type="button"
            size="sm"
            variant={preset === p.value ? "default" : "ghost"}
            data-testid={`date-preset-${p.value}`}
            aria-pressed={preset === p.value}
            onClick={() => selectPreset(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <Input
          type="date"
          className="h-9 w-[9.5rem] bg-white"
          data-testid="date-custom-start"
          aria-label="Custom range start date"
          value={fromDate}
          max={toDate}
          onChange={(e) => setCustomRange(e.target.value, toDate)}
        />
        <span className="text-sm text-muted-foreground">–</span>
        <Input
          type="date"
          className="h-9 w-[9.5rem] bg-white"
          data-testid="date-custom-end"
          aria-label="Custom range end date"
          value={toDate}
          min={fromDate}
          onChange={(e) => setCustomRange(fromDate, e.target.value)}
        />
      </div>
    </div>
  );
}
