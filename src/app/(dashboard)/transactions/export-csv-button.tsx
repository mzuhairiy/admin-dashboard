"use client";

import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Manager-only (the page renders this only for MANAGER). Links to the CSV
 * endpoint with the exact current query, so the export always matches the view.
 */
export function ExportCsvButton() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const href = query ? `/api/export/csv?${query}` : "/api/export/csv";

  return (
    <Button asChild data-testid="export-csv-button">
      <a href={href} download>
        <Download className="mr-2 h-4 w-4" aria-hidden />
        Export CSV
      </a>
    </Button>
  );
}
