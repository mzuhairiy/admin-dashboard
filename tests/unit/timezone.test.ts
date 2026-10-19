import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import {
  addDaysToDateString,
  dateStringInTz,
  dayEndExclusiveUtc,
  dayStartUtc,
  formatDate,
  isValidDateString,
  isValidTimezone,
  toIsoUtc,
} from "@/lib/timezone";

describe("dayStartUtc", () => {
  it("converts a Jakarta calendar day to the correct UTC instant (UTC+7)", () => {
    expect(dayStartUtc("2025-06-15", "Asia/Jakarta").toISOString()).toBe(
      "2025-06-14T17:00:00.000Z",
    );
  });

  it("converts a Tokyo calendar day to the correct UTC instant (UTC+9)", () => {
    expect(dayStartUtc("2025-06-15", "Asia/Tokyo").toISOString()).toBe("2025-06-14T15:00:00.000Z");
  });

  it("is identity for UTC", () => {
    expect(dayStartUtc("2025-06-15", "UTC").toISOString()).toBe("2025-06-15T00:00:00.000Z");
  });
});

describe("dayEndExclusiveUtc", () => {
  it("returns the start of the next day in the timezone", () => {
    expect(dayEndExclusiveUtc("2025-06-15", "Asia/Jakarta").toISOString()).toBe(
      "2025-06-15T17:00:00.000Z",
    );
  });

  it("rolls over month boundaries", () => {
    expect(dayEndExclusiveUtc("2025-06-30", "UTC").toISOString()).toBe("2025-07-01T00:00:00.000Z");
  });
});

describe("dateStringInTz", () => {
  const instant = new Date("2025-12-31T20:00:00Z");

  it("same instant lands on different calendar days per timezone", () => {
    expect(dateStringInTz(instant, "UTC")).toBe("2025-12-31");
    expect(dateStringInTz(instant, "Asia/Jakarta")).toBe("2026-01-01"); // UTC+7 → 03:00 next day
    expect(dateStringInTz(instant, "Asia/Tokyo")).toBe("2026-01-01"); // UTC+9 → 05:00 next day
  });
});

describe("formatDate (display changes, ISO stays constant)", () => {
  const instant = new Date("2026-01-15T10:30:00Z");

  it("formats the same UTC instant differently per timezone", () => {
    expect(formatDate(instant, "UTC", "yyyy-MM-dd HH:mm")).toBe("2026-01-15 10:30");
    expect(formatDate(instant, "Asia/Jakarta", "yyyy-MM-dd HH:mm")).toBe("2026-01-15 17:30");
    expect(formatDate(instant, "Asia/Tokyo", "yyyy-MM-dd HH:mm")).toBe("2026-01-15 19:30");
  });

  it("keeps the ISO UTC representation constant", () => {
    expect(toIsoUtc(instant)).toBe("2026-01-15T10:30:00.000Z");
  });
});

describe("addDaysToDateString", () => {
  it("does not repeat days when the server timezone crosses daylight saving", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "--input-type=module",
        "-e",
        `
      import { addDaysToDateString } from './src/lib/timezone.ts';
      console.log(JSON.stringify([
        addDaysToDateString('2025-03-09', 1),
        addDaysToDateString('2025-11-03', -1),
        addDaysToDateString('2025-03-01', 30),
      ]));
    `,
      ],
      { encoding: "utf8", env: { ...process.env, TZ: "America/New_York" } },
    );
    expect(JSON.parse(output)).toEqual(["2025-03-10", "2025-11-02", "2025-03-31"]);
  });

  it("adds and subtracts across month/year boundaries", () => {
    expect(addDaysToDateString("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDaysToDateString("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDaysToDateString("2026-01-01", -29)).toBe("2025-12-03");
  });
});

describe("validation helpers", () => {
  it("accepts supported timezones and rejects others", () => {
    expect(isValidTimezone("Asia/Jakarta")).toBe(true);
    expect(isValidTimezone("UTC")).toBe(true);
    expect(isValidTimezone("Mars/Olympus")).toBe(false);
  });

  it("validates date strings", () => {
    expect(isValidDateString("2025-06-15")).toBe(true);
    expect(isValidDateString("2025-6-15")).toBe(false);
    expect(isValidDateString("not-a-date")).toBe(false);
  });
});
