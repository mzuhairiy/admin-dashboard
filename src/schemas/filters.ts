import { z } from "zod";
import { FIXED_NOW, DEFAULT_TIMEZONE } from "@/lib/constants";
import {
  addDaysToDateString,
  dateStringInTz,
  dayEndExclusiveUtc,
  dayStartUtc,
  isValidDateString,
  isValidTimezone,
} from "@/lib/timezone";

export const DATE_PRESETS = ["7d", "30d", "90d", "1y", "custom"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export const TRANSACTION_STATUSES = ["PAID", "PENDING", "REFUNDED", "CANCELLED"] as const;
export type TransactionStatusValue = (typeof TRANSACTION_STATUSES)[number];

const PRESET_DAYS: Record<Exclude<DatePreset, "custom">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

/** Raw URL search params (all optional strings). */
export const filterSearchParamsSchema = z.object({
  preset: z.enum(DATE_PRESETS).catch("30d").optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  tz: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

export type FilterSearchParams = z.infer<typeof filterSearchParamsSchema>;

export interface ResolvedFilters {
  preset: DatePreset;
  /** Calendar dates ("yyyy-MM-dd") interpreted in `tz`. */
  fromDate: string;
  toDate: string;
  tz: string;
  categorySlugs: string[];
  statuses: TransactionStatusValue[];
  /** UTC instants for querying (fromUtc inclusive, toUtcExclusive exclusive). */
  fromUtc: Date;
  toUtcExclusive: Date;
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseStatuses(value: string | undefined): TransactionStatusValue[] {
  return parseList(value)
    .map((s) => s.toUpperCase())
    .filter((s): s is TransactionStatusValue =>
      (TRANSACTION_STATUSES as readonly string[]).includes(s),
    );
}

/**
 * Resolve raw URL params into a validated filter state.
 * Date presets anchor to FIXED_NOW ("today" in the selected timezone).
 * Invalid input falls back to defaults instead of throwing (bad deep links
 * should render the default dashboard, not a 500).
 */
export function resolveFilters(
  raw: Record<string, string | string[] | undefined>,
  defaultTz: string = DEFAULT_TIMEZONE,
): ResolvedFilters {
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
  const parsed = filterSearchParamsSchema.safeParse(flat);
  const params: FilterSearchParams = parsed.success ? parsed.data : {};

  const fallbackTz = isValidTimezone(defaultTz) ? defaultTz : DEFAULT_TIMEZONE;
  const tz = params.tz && isValidTimezone(params.tz) ? params.tz : fallbackTz;

  const today = dateStringInTz(FIXED_NOW, tz);

  let preset: DatePreset = params.preset ?? "30d";
  let fromDate: string;
  let toDate: string;

  const hasValidCustomRange =
    params.from !== undefined &&
    params.to !== undefined &&
    isValidDateString(params.from) &&
    isValidDateString(params.to) &&
    params.from <= params.to;

  if (preset === "custom" && hasValidCustomRange) {
    fromDate = params.from as string;
    toDate = params.to as string;
  } else {
    if (preset === "custom") preset = "30d";
    const days = PRESET_DAYS[preset];
    toDate = today;
    fromDate = addDaysToDateString(today, -(days - 1));
  }

  return {
    preset,
    fromDate,
    toDate,
    tz,
    categorySlugs: parseList(params.category),
    statuses: parseStatuses(params.status),
    fromUtc: dayStartUtc(fromDate, tz),
    toUtcExclusive: dayEndExclusiveUtc(toDate, tz),
  };
}

/** Serialize resolved filters back to URL query params (omitting defaults). */
export function filtersToSearchParams(filters: {
  preset: DatePreset;
  fromDate?: string;
  toDate?: string;
  tz?: string;
  categorySlugs?: string[];
  statuses?: string[];
}): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.preset === "custom") {
    params.set("preset", "custom");
    if (filters.fromDate) params.set("from", filters.fromDate);
    if (filters.toDate) params.set("to", filters.toDate);
  } else if (filters.preset !== "30d") {
    params.set("preset", filters.preset);
  }
  if (filters.tz) params.set("tz", filters.tz);
  if (filters.categorySlugs?.length) params.set("category", filters.categorySlugs.join(","));
  if (filters.statuses?.length) params.set("status", filters.statuses.join(","));
  return params;
}
