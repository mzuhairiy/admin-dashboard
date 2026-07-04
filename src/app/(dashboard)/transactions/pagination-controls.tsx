"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZES, type TableParams } from "@/schemas/table";

interface PaginationControlsProps {
  params: TableParams;
  pageCount: number;
  total: number;
}

export function PaginationControls({ params, pageCount, total }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = (updates: Record<string, string | null>) => {
    const query = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) query.delete(key);
      else query.set(key, value);
    }
    router.push(`${pathname}?${query.toString()}`, { scroll: false });
  };

  return (
    <div data-testid="pagination" className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page</span>
        <Select
          value={String(params.pageSize)}
          onValueChange={(value) => update({ pageSize: value, page: null })}
        >
          <SelectTrigger data-testid="page-size-select" className="h-8 w-20 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)} data-testid={`page-size-${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span data-testid="pagination-total">{total} transactions</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          data-testid="pagination-prev"
          disabled={params.page <= 1}
          onClick={() => update({ page: String(params.page - 1) })}
        >
          Previous
        </Button>
        <span data-testid="pagination-info" className="text-sm tabular-nums">
          Page {params.page} of {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          data-testid="pagination-next"
          disabled={params.page >= pageCount}
          onClick={() => update({ page: String(params.page + 1) })}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
