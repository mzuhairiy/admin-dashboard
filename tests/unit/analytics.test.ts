import { describe, expect, it } from "vitest";
import {
  bucketRevenueTrend,
  buildTransactionWhere,
  trendGranularity,
} from "@/server/services/analytics";
import { resolveFilters } from "@/schemas/filters";

describe("buildTransactionWhere", () => {
  it("always constrains the date range", () => {
    const filters = resolveFilters({ preset: "7d", tz: "UTC" });
    const where = buildTransactionWhere(filters);
    expect(where.createdAt).toEqual({ gte: filters.fromUtc, lt: filters.toUtcExclusive });
    expect(where.category).toBeUndefined();
    expect(where.status).toBeUndefined();
  });

  it("adds category and status constraints when selected", () => {
    const filters = resolveFilters({ category: "books,toys", status: "PAID,REFUNDED" });
    const where = buildTransactionWhere(filters);
    expect(where.category).toEqual({ slug: { in: ["books", "toys"] } });
    expect(where.status).toEqual({ in: ["PAID", "REFUNDED"] });
  });
});

describe("trendGranularity", () => {
  it("uses daily buckets up to 90 days and monthly beyond", () => {
    expect(trendGranularity(resolveFilters({ preset: "7d" }))).toBe("day");
    expect(trendGranularity(resolveFilters({ preset: "90d" }))).toBe("day");
    expect(trendGranularity(resolveFilters({ preset: "1y" }))).toBe("month");
  });
});

describe("bucketRevenueTrend", () => {
  it("buckets revenue per day in the filter timezone and zero-fills gaps", () => {
    const filters = resolveFilters({
      preset: "custom",
      from: "2025-06-01",
      to: "2025-06-03",
      tz: "Asia/Jakarta",
    });
    // 2025-05-31T18:00Z = 2025-06-01 01:00 in Jakarta (UTC+7)
    const rows = [
      { createdAt: new Date("2025-05-31T18:00:00Z"), amount: 100_000 },
      { createdAt: new Date("2025-06-01T10:00:00Z"), amount: 50_000 },
      { createdAt: new Date("2025-06-02T18:00:00Z"), amount: 25_000 }, // Jakarta: 03 Jun 01:00
    ];
    expect(bucketRevenueTrend(rows, filters)).toEqual([
      { date: "2025-06-01", revenue: 150_000 },
      { date: "2025-06-02", revenue: 0 },
      { date: "2025-06-03", revenue: 25_000 },
    ]);
  });

  it("the same instants land in different buckets in UTC", () => {
    const filters = resolveFilters({
      preset: "custom",
      from: "2025-05-31",
      to: "2025-06-03",
      tz: "UTC",
    });
    const rows = [
      { createdAt: new Date("2025-05-31T18:00:00Z"), amount: 100_000 },
      { createdAt: new Date("2025-06-01T10:00:00Z"), amount: 50_000 },
    ];
    expect(bucketRevenueTrend(rows, filters)).toEqual([
      { date: "2025-05-31", revenue: 100_000 },
      { date: "2025-06-01", revenue: 50_000 },
      { date: "2025-06-02", revenue: 0 },
      { date: "2025-06-03", revenue: 0 },
    ]);
  });

  it("buckets monthly for ranges beyond 90 days", () => {
    const filters = resolveFilters({
      preset: "custom",
      from: "2025-01-01",
      to: "2025-06-30",
      tz: "UTC",
    });
    const rows = [
      { createdAt: new Date("2025-01-15T00:00:00Z"), amount: 10 },
      { createdAt: new Date("2025-01-20T00:00:00Z"), amount: 20 },
      { createdAt: new Date("2025-06-01T00:00:00Z"), amount: 5 },
    ];
    const result = bucketRevenueTrend(rows, filters);
    expect(result).toHaveLength(6);
    expect(result[0]).toEqual({ date: "2025-01", revenue: 30 });
    expect(result[5]).toEqual({ date: "2025-06", revenue: 5 });
  });

  it("ignores rows outside the bucket range", () => {
    const filters = resolveFilters({
      preset: "custom",
      from: "2025-06-01",
      to: "2025-06-02",
      tz: "UTC",
    });
    const rows = [{ createdAt: new Date("2025-07-01T00:00:00Z"), amount: 999 }];
    expect(bucketRevenueTrend(rows, filters)).toEqual([
      { date: "2025-06-01", revenue: 0 },
      { date: "2025-06-02", revenue: 0 },
    ]);
  });
});
