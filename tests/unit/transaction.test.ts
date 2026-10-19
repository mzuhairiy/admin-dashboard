import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { resolveFilters } from "@/schemas/filters";
import { resolveTableParams } from "@/schemas/table";
import { listTransactions, listTransactionsForExport } from "@/server/services/transaction";

vi.mock("@/lib/db", () => ({ db: { transaction: { count: vi.fn(), findMany: vi.fn() } } }));

describe("transaction pagination", () => {
  beforeEach(() => {
    vi.mocked(db.transaction.findMany).mockResolvedValue([]);
  });

  it("clamps stale deep links before computing a database offset", async () => {
    vi.mocked(db.transaction.count).mockResolvedValue(41);
    const page = await listTransactions(
      resolveFilters({}),
      resolveTableParams({ page: "999999999999", pageSize: "20" }),
    );
    expect(page).toMatchObject({ total: 41, pageCount: 3, page: 3 });
    expect(db.transaction.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 40, take: 20 }),
    );
  });

  it("keeps an empty result on page one", async () => {
    vi.mocked(db.transaction.count).mockResolvedValue(0);
    const page = await listTransactions(resolveFilters({}), resolveTableParams({ page: "9" }));
    expect(page).toMatchObject({ total: 0, pageCount: 1, page: 1, rows: [] });
    expect(db.transaction.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 0 }));
  });

  it("uses identical filters and stable ordering for paginated rows and export", async () => {
    vi.mocked(db.transaction.count).mockResolvedValue(50);
    const filters = resolveFilters({ category: "books", status: "PAID,REFUNDED", tz: "UTC" });
    await listTransactions(
      filters,
      resolveTableParams({ page: "2", sort: "amount", order: "asc" }),
    );
    const tableQuery = vi.mocked(db.transaction.findMany).mock.lastCall?.[0];
    await listTransactionsForExport(filters, "amount", "asc");
    const exportQuery = vi.mocked(db.transaction.findMany).mock.lastCall?.[0];
    expect(tableQuery?.orderBy).toEqual([{ amount: "asc" }, { externalId: "asc" }]);
    expect(exportQuery?.where).toEqual(tableQuery?.where);
    expect(exportQuery?.orderBy).toEqual(tableQuery?.orderBy);
    expect(exportQuery).not.toHaveProperty("skip");
    expect(exportQuery).not.toHaveProperty("take");
  });
});
