import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ResolvedFilters } from "@/schemas/filters";
import { addDaysToDateString, dateStringInTz } from "@/lib/timezone";

/**
 * Revenue semantics: revenue = sum of PAID transaction amounts. A status filter
 * narrows the transaction set first, so filtering to e.g. REFUNDED yields revenue 0.
 */

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  /** Percentage 0-100, one-decimal precision. */
  refundRate: number;
}

export interface TrendPoint {
  /** "yyyy-MM-dd" (daily) or "yyyy-MM" (monthly) in the filter timezone. */
  date: string;
  revenue: number;
}

export interface CategoryRevenue {
  categoryName: string;
  categorySlug: string;
  revenue: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

/** Prisma where-clause for the resolved filters (all filtering happens server-side). */
export function buildTransactionWhere(filters: ResolvedFilters): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {
    createdAt: { gte: filters.fromUtc, lt: filters.toUtcExclusive },
  };
  if (filters.categorySlugs.length > 0) {
    where.category = { slug: { in: filters.categorySlugs } };
  }
  if (filters.statuses.length > 0) {
    where.status = { in: filters.statuses };
  }
  return where;
}

/** Range longer than this (days) aggregates the trend per month instead of per day. */
const MONTHLY_THRESHOLD_DAYS = 90;

export function trendGranularity(filters: ResolvedFilters): "day" | "month" {
  const days =
    Math.round(
      (filters.toUtcExclusive.getTime() - filters.fromUtc.getTime()) / (24 * 60 * 60 * 1000),
    ) || 1;
  return days > MONTHLY_THRESHOLD_DAYS ? "month" : "day";
}

/**
 * Bucket PAID transactions into a zero-filled revenue series in the filter timezone.
 * Pure function — unit-testable without a database.
 */
export function bucketRevenueTrend(
  rows: Array<{ createdAt: Date; amount: number }>,
  filters: ResolvedFilters,
): TrendPoint[] {
  const granularity = trendGranularity(filters);
  const keyLength = granularity === "day" ? 10 : 7; // yyyy-MM-dd vs yyyy-MM

  const buckets = new Map<string, number>();
  for (
    let date = filters.fromDate;
    date <= filters.toDate;
    date = addDaysToDateString(date, 1)
  ) {
    buckets.set(date.slice(0, keyLength), 0);
  }
  for (const row of rows) {
    const key = dateStringInTz(row.createdAt, filters.tz).slice(0, keyLength);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + row.amount);
  }
  return Array.from(buckets.entries()).map(([date, revenue]) => ({ date, revenue }));
}

export async function getDashboardStats(filters: ResolvedFilters): Promise<DashboardStats> {
  const where = buildTransactionWhere(filters);
  const byStatus = await db.transaction.groupBy({
    by: ["status"],
    where,
    _count: { _all: true },
    _sum: { amount: true },
  });

  const totalOrders = byStatus.reduce((acc, group) => acc + group._count._all, 0);
  const paid = byStatus.find((group) => group.status === "PAID");
  const refunded = byStatus.find((group) => group.status === "REFUNDED");
  const totalRevenue = paid?._sum.amount ?? 0;
  const paidCount = paid?._count._all ?? 0;
  const refundedCount = refunded?._count._all ?? 0;

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue: paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0,
    refundRate: totalOrders > 0 ? Math.round((refundedCount / totalOrders) * 1000) / 10 : 0,
  };
}

export async function getRevenueTrend(filters: ResolvedFilters): Promise<TrendPoint[]> {
  const where = buildTransactionWhere(filters);
  const rows = await db.transaction.findMany({
    where: { ...where, status: "PAID" },
    select: { createdAt: true, amount: true },
  });
  return bucketRevenueTrend(rows, filters);
}

export async function getTopCategories(
  filters: ResolvedFilters,
  limit = 10,
): Promise<CategoryRevenue[]> {
  const where = buildTransactionWhere(filters);
  const grouped = await db.transaction.groupBy({
    by: ["categoryId"],
    where: { ...where, status: "PAID" },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });
  const categories = await db.category.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId) } },
    select: { id: true, name: true, slug: true },
  });
  const byId = new Map(categories.map((c) => [c.id, c]));
  return grouped.map((g) => ({
    categoryName: byId.get(g.categoryId)?.name ?? "Unknown",
    categorySlug: byId.get(g.categoryId)?.slug ?? "unknown",
    revenue: g._sum.amount ?? 0,
  }));
}

export async function getStatusDistribution(filters: ResolvedFilters): Promise<StatusCount[]> {
  const where = buildTransactionWhere(filters);
  const grouped = await db.transaction.groupBy({
    by: ["status"],
    where,
    _count: { _all: true },
  });
  const order = ["PAID", "PENDING", "REFUNDED", "CANCELLED"];
  return grouped
    .map((g) => ({ status: g.status, count: g._count._all }))
    .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
}
