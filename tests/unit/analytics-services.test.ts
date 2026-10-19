import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { resolveFilters } from "@/schemas/filters";
import {
  buildTransactionWhere,
  getRevenueTrend,
  getTopCategories,
} from "@/server/services/analytics";

vi.mock("@/lib/db", () => ({
  db: {
    transaction: { findMany: vi.fn(), groupBy: vi.fn() },
    category: { findMany: vi.fn() },
  },
}));

describe("revenue query status constraints", () => {
  beforeEach(() => {
    vi.mocked(db.transaction.findMany).mockResolvedValue([]);
    vi.mocked(db.transaction.groupBy).mockResolvedValue([]);
    vi.mocked(db.category.findMany).mockResolvedValue([]);
  });

  it.each(["REFUNDED", "PENDING,CANCELLED", "PAID,REFUNDED", "PAID", ""])(
    "intersects the selected statuses (%s) with PAID for both charts",
    async (status) => {
      const filters = resolveFilters({ status, category: "books", preset: "7d", tz: "UTC" });
      const expectedWhere = { AND: [buildTransactionWhere(filters), { status: "PAID" }] };

      const trend = await getRevenueTrend(filters);
      const categories = await getTopCategories(filters);

      // Both constraints must reach Prisma; replacing the selected status would
      // show PAID revenue even when only refunded/pending orders were requested.
      expect(db.transaction.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ where: expectedWhere }),
      );
      expect(db.transaction.groupBy).toHaveBeenLastCalledWith(
        expect.objectContaining({ where: expectedWhere }),
      );
      expect(trend).toHaveLength(7);
      expect(trend.every((point) => point.revenue === 0)).toBe(true);
      expect(categories).toEqual([]);
    },
  );
});
