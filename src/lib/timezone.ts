import { addDays, subDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** Timezones offered in the global filter bar. */
export const FILTER_TIMEZONES = ["Asia/Jakarta", "Asia/Singapore", "Asia/Tokyo", "UTC"] as const;

/** Timezones offered in user settings (superset of the filter list). */
export const SETTINGS_TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Europe/London",
  "America/New_York",
  "UTC",
] as const;

export function isValidTimezone(tz: string): boolean {
  return (SETTINGS_TIMEZONES as readonly string[]).includes(tz);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  return !Number.isNaN(fromZonedTime(`${value}T00:00:00`, "UTC").getTime());
}

/** UTC instant at which calendar day `dateStr` starts in timezone `tz`. */
export function dayStartUtc(dateStr: string, tz: string): Date {
  return fromZonedTime(`${dateStr}T00:00:00`, tz);
}

/** Exclusive upper bound: UTC instant at which the day AFTER `dateStr` starts in `tz`. */
export function dayEndExclusiveUtc(dateStr: string, tz: string): Date {
  const nextDay = addDaysToDateString(dateStr, 1);
  return fromZonedTime(`${nextDay}T00:00:00`, tz);
}

/** Pure calendar-date arithmetic on "yyyy-MM-dd" strings (independent of server timezone). */
export function addDaysToDateString(dateStr: string, days: number): string {
  const base = fromZonedTime(`${dateStr}T00:00:00`, "UTC");
  const shifted = days >= 0 ? addDays(base, days) : subDays(base, -days);
  return formatInTimeZone(shifted, "UTC", "yyyy-MM-dd");
}

/** Calendar date ("yyyy-MM-dd") of a UTC instant, as seen in timezone `tz`. */
export function dateStringInTz(date: Date, tz: string): string {
  return formatInTimeZone(date, tz, "yyyy-MM-dd");
}

/** Format a UTC instant for display in timezone `tz`. */
export function formatDate(date: Date, tz: string, pattern = "dd MMM yyyy, HH:mm"): string {
  return formatInTimeZone(date, tz, pattern);
}

/** ISO-8601 UTC string ("...Z") — used for data-iso testability attributes. */
export function toIsoUtc(date: Date): string {
  return date.toISOString();
}
