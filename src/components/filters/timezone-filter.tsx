"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FILTER_TIMEZONES } from "@/lib/timezone";
import { useFilterParams } from "@/components/filters/use-filter-params";

export function TimezoneFilter({ tz }: { tz: string }) {
  const { setParams } = useFilterParams();
  const options = (FILTER_TIMEZONES as readonly string[]).includes(tz)
    ? FILTER_TIMEZONES
    : [tz, ...FILTER_TIMEZONES];

  return (
    <Select value={tz} onValueChange={(value) => setParams({ tz: value })}>
      <SelectTrigger data-testid="filter-timezone" className="w-[11rem] bg-white">
        <SelectValue placeholder="Timezone" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option}
            value={option}
            data-testid={`filter-timezone-${option.replace(/\//g, "-").toLowerCase()}`}
          >
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
