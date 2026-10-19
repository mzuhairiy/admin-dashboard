import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ResolvedFilters } from "@/schemas/filters";
import type { SortColumn, SortOrder, TableParams } from "@/schemas/table";
import { buildTransactionWhere } from "@/server/services/analytics";

export interface TransactionRow {
  externalId: string;
  createdAt: Date;
  customerName: string;
  customerCity: string;
  categoryName: string;
  amount: number;
  status: string;
}

export interface TransactionPage {
  rows: TransactionRow[];
  total: number;
  pageCount: number;
  page: number;
}

/**
 * Deterministic ordering: the requested column first, then externalId as a
 * tie-breaker, so table pagination and CSV export always agree row-for-row.
 */
export function buildOrderBy(
  sort: SortColumn,
  order: SortOrder,
): Prisma.TransactionOrderByWithRelationInput[] {
  const primary: Record<SortColumn, Prisma.TransactionOrderByWithRelationInput> = {
    id: { externalId: order },
    date: { createdAt: order },
    customer: { customerName: order },
    category: { category: { name: order } },
    amount: { amount: order },
    status: { status: order },
  };
  return [primary[sort], { externalId: "asc" }];
}

const rowSelect = {
  externalId: true,
  createdAt: true,
  customerName: true,
  customerCity: true,
  amount: true,
  status: true,
  category: { select: { name: true } },
} satisfies Prisma.TransactionSelect;

type RawRow = Prisma.TransactionGetPayload<{ select: typeof rowSelect }>;

function toRow(row: RawRow): TransactionRow {
  return {
    externalId: row.externalId,
    createdAt: row.createdAt,
    customerName: row.customerName,
    customerCity: row.customerCity,
    categoryName: row.category.name,
    amount: row.amount,
    status: row.status,
  };
}

export async function listTransactions(
  filters: ResolvedFilters,
  params: TableParams,
): Promise<TransactionPage> {
  const where = buildTransactionWhere(filters);
  const total = await db.transaction.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / params.pageSize));
  const page = Math.min(params.page, pageCount);
  const rows = await db.transaction.findMany({
    where,
    select: rowSelect,
    orderBy: buildOrderBy(params.sort, params.order),
    skip: (page - 1) * params.pageSize,
    take: params.pageSize,
  });
  return {
    rows: rows.map(toRow),
    total,
    pageCount,
    page,
  };
}

/** Full (unpaginated) result in the same order as the table — used by CSV export. */
export async function listTransactionsForExport(
  filters: ResolvedFilters,
  sort: SortColumn,
  order: SortOrder,
): Promise<TransactionRow[]> {
  const rows = await db.transaction.findMany({
    where: buildTransactionWhere(filters),
    select: rowSelect,
    orderBy: buildOrderBy(sort, order),
  });
  return rows.map(toRow);
}
