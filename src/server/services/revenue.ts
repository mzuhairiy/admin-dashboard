import { db } from "@/lib/db";
import type { ResolvedFilters } from "@/schemas/filters";
import { dateStringInTz } from "@/lib/timezone";
import { buildTransactionWhere } from "@/server/services/analytics";

export interface MonthlyCategoryRevenue {
  /** "yyyy-MM" in the filter timezone. */
  month: string;
  /** Revenue per category name (PAID only). */
  byCategory: Record<string, number>;
  totalRevenue: number;
  orders: number;
}

export interface RevenueBreakdown {
  months: MonthlyCategoryRevenue[];
  categoryNames: string[];
}

/** Pure bucketing helper — unit-testable without a database. */
export function bucketMonthlyCategoryRevenue(
  rows: Array<{ createdAt: Date; amount: number; categoryName: string; status: string }>,
  tz: string,
): RevenueBreakdown {
  const months = new Map<string, MonthlyCategoryRevenue>();
  const categoryNames = new Set<string>();

  for (const row of rows) {
    const month = dateStringInTz(row.createdAt, tz).slice(0, 7);
    let bucket = months.get(month);
    if (!bucket) {
      bucket = { month, byCategory: {}, totalRevenue: 0, orders: 0 };
      months.set(month, bucket);
    }
    bucket.orders += 1;
    if (row.status === "PAID") {
      categoryNames.add(row.categoryName);
      bucket.byCategory[row.categoryName] =
        (bucket.byCategory[row.categoryName] ?? 0) + row.amount;
      bucket.totalRevenue += row.amount;
    }
  }

  return {
    months: Array.from(months.values()).sort((a, b) => a.month.localeCompare(b.month)),
    categoryNames: Array.from(categoryNames).sort(),
  };
}

/** Month × category revenue matrix (PAID revenue; orders count all statuses in filter). */
export async function getMonthlyCategoryRevenue(
  filters: ResolvedFilters,
): Promise<RevenueBreakdown> {
  const rows = await db.transaction.findMany({
    where: buildTransactionWhere(filters),
    select: {
      createdAt: true,
      amount: true,
      status: true,
      category: { select: { name: true } },
    },
  });
  return bucketMonthlyCategoryRevenue(
    rows.map((row) => ({
      createdAt: row.createdAt,
      amount: row.amount,
      status: row.status,
      categoryName: row.category.name,
    })),
    filters.tz,
  );
}
