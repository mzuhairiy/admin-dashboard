"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TRANSACTION_STATUSES, type TransactionStatusValue } from "@/schemas/filters";
import { useFilterParams } from "@/components/filters/use-filter-params";

const STATUS_LABELS: Record<TransactionStatusValue, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
};

export function StatusFilter({ selected }: { selected: TransactionStatusValue[] }) {
  const { setParams } = useFilterParams();

  const toggle = (status: TransactionStatusValue, checked: boolean) => {
    const next = checked ? [...selected, status] : selected.filter((s) => s !== status);
    setParams({ status: next.length ? next.join(",") : null });
  };

  const label =
    selected.length === 0
      ? "All statuses"
      : selected.length === 1
        ? STATUS_LABELS[selected[0]]
        : `${selected.length} statuses`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" data-testid="filter-status" className="bg-white">
          {label}
          <ChevronDown className="ml-2 h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TRANSACTION_STATUSES.map((status) => (
          <DropdownMenuCheckboxItem
            key={status}
            data-testid={`filter-status-${status.toLowerCase()}`}
            checked={selected.includes(status)}
            onCheckedChange={(checked) => toggle(status, checked === true)}
            onSelect={(e) => e.preventDefault()}
          >
            {STATUS_LABELS[status]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
