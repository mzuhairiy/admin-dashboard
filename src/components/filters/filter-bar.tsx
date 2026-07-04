"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import { TimezoneFilter } from "@/components/filters/timezone-filter";
import { CategoryFilter } from "@/components/filters/category-filter";
import { StatusFilter } from "@/components/filters/status-filter";
import { useFilterParams } from "@/components/filters/use-filter-params";
import type { CategoryOption } from "@/server/services/category";
import type { DatePreset, TransactionStatusValue } from "@/schemas/filters";

export interface FilterBarState {
  preset: DatePreset;
  fromDate: string;
  toDate: string;
  tz: string;
  categorySlugs: string[];
  statuses: TransactionStatusValue[];
}

interface FilterBarProps {
  filters: FilterBarState;
  categories: CategoryOption[];
}

export function FilterBar({ filters, categories }: FilterBarProps) {
  const { clearAll } = useFilterParams();

  return (
    <div
      data-testid="filter-bar"
      className="flex flex-wrap items-center gap-3 rounded-lg border bg-slate-50/60 p-3"
    >
      <DateRangeFilter preset={filters.preset} fromDate={filters.fromDate} toDate={filters.toDate} />
      <TimezoneFilter tz={filters.tz} />
      <CategoryFilter categories={categories} selected={filters.categorySlugs} />
      <StatusFilter selected={filters.statuses} />
      <Button type="button" variant="ghost" size="sm" data-testid="filter-clear" onClick={clearAll}>
        <X className="mr-1 h-4 w-4" aria-hidden />
        Clear
      </Button>
    </div>
  );
}
