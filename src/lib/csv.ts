import Papa from "papaparse";
import type { TransactionRow } from "@/server/services/transaction";
import { formatDate, toIsoUtc } from "@/lib/timezone";

export const CSV_HEADERS = [
  "Transaction ID",
  "Date (ISO UTC)",
  "Date (Local)",
  "Customer",
  "Category",
  "Amount",
  "Status",
] as const;

/**
 * Deterministic CSV: rows are emitted in the order given (which matches the
 * table ordering), values escaped per RFC 4180 via PapaParse.
 */
export function generateTransactionsCsv(rows: TransactionRow[], tz: string): string {
  return Papa.unparse(
    {
      fields: [...CSV_HEADERS],
      data: rows.map((row) => [
        row.externalId,
        toIsoUtc(row.createdAt),
        formatDate(row.createdAt, tz, "yyyy-MM-dd HH:mm:ss"),
        row.customerName,
        row.categoryName,
        String(row.amount),
        row.status,
      ]),
    },
    { newline: "\n" },
  );
}

/** Deterministic filename: transactions-{from}-{to}-{tz}.csv ("/" → "-" for filesystem safety). */
export function csvFilename(fromDate: string, toDate: string, tz: string): string {
  const safeTz = tz.replace(/\//g, "-");
  return `transactions-${fromDate}-${toDate}-${safeTz}.csv`;
}
