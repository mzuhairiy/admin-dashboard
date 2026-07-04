import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { formatDate, toIsoUtc } from "@/lib/timezone";
import type { TransactionRow } from "@/server/services/transaction";
import type { SortColumn, TableParams } from "@/schemas/table";

const COLUMNS: Array<{ key: SortColumn; label: string }> = [
  { key: "id", label: "Transaction ID" },
  { key: "date", label: "Date" },
  { key: "customer", label: "Customer" },
  { key: "category", label: "Category" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
];

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  PENDING: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  REFUNDED: "bg-rose-100 text-rose-800 hover:bg-rose-100",
  CANCELLED: "bg-slate-200 text-slate-700 hover:bg-slate-200",
};

interface TransactionsTableProps {
  rows: TransactionRow[];
  params: TableParams;
  /** Current URL query — sort links preserve filters. */
  searchParams: Record<string, string | string[] | undefined>;
  tz: string;
  currency: string;
}

function sortHref(
  column: SortColumn,
  params: TableParams,
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    const flat = Array.isArray(value) ? value[0] : value;
    if (flat !== undefined) query.set(key, flat);
  }
  query.set("sort", column);
  query.set("order", params.sort === column && params.order === "asc" ? "desc" : "asc");
  query.delete("page"); // sorting restarts at page 1
  return `/transactions?${query.toString()}`;
}

export function TransactionsTable({
  rows,
  params,
  searchParams,
  tz,
  currency,
}: TransactionsTableProps) {
  return (
    <div className="rounded-lg border bg-white">
      <Table data-testid="transactions-table">
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => {
              const active = params.sort === column.key;
              const Icon = active ? (params.order === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
              return (
                <TableHead key={column.key}>
                  <Link
                    href={sortHref(column.key, params, searchParams)}
                    data-testid={`sort-${column.key}`}
                    aria-sort={
                      active ? (params.order === "asc" ? "ascending" : "descending") : undefined
                    }
                    className={cn(
                      "inline-flex items-center gap-1 hover:text-foreground",
                      active && "font-semibold text-foreground",
                    )}
                  >
                    {column.label}
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.externalId} data-testid="transaction-row" data-tx-id={row.externalId}>
              <TableCell data-testid="column-id" className="font-mono text-xs">
                {row.externalId}
              </TableCell>
              <TableCell data-testid="column-date" data-iso={toIsoUtc(row.createdAt)}>
                {formatDate(row.createdAt, tz)}
              </TableCell>
              <TableCell data-testid="column-customer">{row.customerName}</TableCell>
              <TableCell data-testid="column-category">{row.categoryName}</TableCell>
              <TableCell data-testid="column-amount" data-value={row.amount} className="tabular-nums">
                {formatCurrency(row.amount, currency)}
              </TableCell>
              <TableCell data-testid="column-status">
                <Badge className={STATUS_BADGE[row.status] ?? ""} data-status={row.status}>
                  {row.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
