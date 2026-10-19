import type { Metadata } from "next";
import { requireSession } from "@/lib/rbac";
import { canExportCsv } from "@/lib/roles";
import { resolveFilters } from "@/schemas/filters";
import { resolveTableParams } from "@/schemas/table";
import { listTransactions } from "@/server/services/transaction";
import { listCategories } from "@/server/services/category";
import { getUserPrefs } from "@/server/services/user";
import { FilterBar } from "@/components/filters/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionsTable } from "./transactions-table";
import { PaginationControls } from "./pagination-controls";
import { ExportCsvButton } from "./export-csv-button";

export const metadata: Metadata = {
  title: "Transactions",
};

interface TransactionsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const session = await requireSession();
  const prefs = await getUserPrefs(session.user.id);
  const filters = resolveFilters(searchParams, prefs.timezone);
  const params = resolveTableParams(searchParams);

  const [categories, page] = await Promise.all([
    listCategories(),
    listTransactions(filters, params),
  ]);

  return (
    <div data-testid="transactions-page" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filters.fromDate} – {filters.toDate} · {filters.tz}
          </p>
        </div>
        {canExportCsv(session.user.role) ? <ExportCsvButton /> : null}
      </div>

      <FilterBar filters={filters} categories={categories} />

      {page.total === 0 ? (
        <EmptyState />
      ) : (
        <>
          <TransactionsTable
            rows={page.rows}
            params={{ ...params, page: page.page }}
            searchParams={searchParams}
            tz={filters.tz}
            currency={prefs.currency}
          />
          <PaginationControls
            params={{ ...params, page: page.page }}
            pageCount={page.pageCount}
            total={page.total}
          />
        </>
      )}
    </div>
  );
}
