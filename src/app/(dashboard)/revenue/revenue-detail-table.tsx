"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/format";
import { formatBucketLabel } from "@/components/charts/chart-utils";
import type { MonthlyCategoryRevenue } from "@/server/services/revenue";

interface RevenueDetailTableProps {
  months: MonthlyCategoryRevenue[];
  currency: string;
}

/** Month rows with an expandable per-category drill-down. */
export function RevenueDetailTable({ months, currency }: RevenueDetailTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="rounded-lg border bg-white">
      <Table data-testid="revenue-detail-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Month</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Revenue (PAID)</TableHead>
            <TableHead>Avg per Order</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((month) => {
            const isOpen = expanded === month.month;
            const categories = Object.entries(month.byCategory).sort((a, b) => b[1] - a[1]);
            return (
              <Fragment key={month.month}>
                <TableRow data-testid="revenue-month-row" data-month={month.month}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      data-testid={`revenue-drilldown-${month.month}`}
                      aria-expanded={isOpen}
                      aria-label={`Toggle ${month.month} breakdown`}
                      onClick={() => setExpanded(isOpen ? null : month.month)}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" aria-hidden />
                      ) : (
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{formatBucketLabel(month.month)}</TableCell>
                  <TableCell data-testid="revenue-month-orders" data-value={month.orders}>
                    {formatNumber(month.orders)}
                  </TableCell>
                  <TableCell
                    data-testid="revenue-month-total"
                    data-value={month.totalRevenue}
                    className="tabular-nums"
                  >
                    {formatCurrency(month.totalRevenue, currency)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(
                      month.orders > 0 ? Math.round(month.totalRevenue / month.orders) : 0,
                      currency,
                    )}
                  </TableCell>
                </TableRow>
                {isOpen
                  ? categories.map(([categoryName, revenue]) => (
                      <TableRow
                        key={`${month.month}-${categoryName}`}
                        data-testid="revenue-category-row"
                        data-month={month.month}
                        data-category={categoryName}
                        className="bg-slate-50"
                      >
                        <TableCell />
                        <TableCell className="pl-10 text-sm text-muted-foreground">
                          {categoryName}
                        </TableCell>
                        <TableCell />
                        <TableCell
                          data-testid="revenue-category-value"
                          data-value={revenue}
                          className="tabular-nums text-sm"
                        >
                          {formatCurrency(revenue, currency)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    ))
                  : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
