import { describe, expect, it } from "vitest";
import { resolveFilters, filtersToSearchParams } from "@/schemas/filters";

// FIXED_NOW is 2026-01-01T00:00:00Z; in Asia/Jakarta (UTC+7) "today" is 2026-01-01.

describe("resolveFilters", () => {
  it("defaults to a 30-day preset in the default timezone", () => {
    const filters = resolveFilters({});
    expect(filters.preset).toBe("30d");
    expect(filters.tz).toBe("Asia/Jakarta");
    expect(filters.toDate).toBe("2026-01-01");
    expect(filters.fromDate).toBe("2025-12-03");
    expect(filters.statuses).toEqual([]);
    expect(filters.categorySlugs).toEqual([]);
  });

  it("anchors 'today' to FIXED_NOW in the selected timezone", () => {
    const utc = resolveFilters({ tz: "UTC" });
    expect(utc.toDate).toBe("2026-01-01");
    const jakarta = resolveFilters({ tz: "Asia/Jakarta" });
    expect(jakarta.fromUtc.toISOString()).toBe("2025-12-02T17:00:00.000Z");
    expect(jakarta.toUtcExclusive.toISOString()).toBe("2026-01-01T17:00:00.000Z");
  });

  it("honours a valid custom range", () => {
    const filters = resolveFilters({ preset: "custom", from: "2025-05-01", to: "2025-05-31" });
    expect(filters.preset).toBe("custom");
    expect(filters.fromDate).toBe("2025-05-01");
    expect(filters.toDate).toBe("2025-05-31");
  });

  it("falls back to 30d when a custom range is invalid or reversed", () => {
    expect(resolveFilters({ preset: "custom", from: "2025-05-31", to: "2025-05-01" }).preset).toBe(
      "30d",
    );
    expect(resolveFilters({ preset: "custom", from: "garbage", to: "2025-05-01" }).preset).toBe(
      "30d",
    );
    expect(resolveFilters({ preset: "custom" }).preset).toBe("30d");
  });

  it("parses category and status lists, dropping invalid statuses", () => {
    const filters = resolveFilters({
      category: "electronics,fashion",
      status: "paid,REFUNDED,bogus",
    });
    expect(filters.categorySlugs).toEqual(["electronics", "fashion"]);
    expect(filters.statuses).toEqual(["PAID", "REFUNDED"]);
  });

  it("ignores an unsupported timezone and uses the user default", () => {
    const filters = resolveFilters({ tz: "Mars/Olympus" }, "Asia/Tokyo");
    expect(filters.tz).toBe("Asia/Tokyo");
  });

  it("computes 7d and 1y ranges", () => {
    expect(resolveFilters({ preset: "7d" }).fromDate).toBe("2025-12-26");
    expect(resolveFilters({ preset: "1y" }).fromDate).toBe("2025-01-02");
  });
});

describe("filtersToSearchParams", () => {
  it("omits defaults and serializes non-default state", () => {
    const params = filtersToSearchParams({
      preset: "7d",
      tz: "Asia/Tokyo",
      categorySlugs: ["books"],
      statuses: ["PAID"],
    });
    expect(params.get("preset")).toBe("7d");
    expect(params.get("tz")).toBe("Asia/Tokyo");
    expect(params.get("category")).toBe("books");
    expect(params.get("status")).toBe("PAID");
  });

  it("serializes custom ranges with from/to", () => {
    const params = filtersToSearchParams({
      preset: "custom",
      fromDate: "2025-05-01",
      toDate: "2025-05-31",
    });
    expect(params.get("preset")).toBe("custom");
    expect(params.get("from")).toBe("2025-05-01");
    expect(params.get("to")).toBe("2025-05-31");
  });
});
