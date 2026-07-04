import { SearchX } from "lucide-react";

export function EmptyState({
  message = "No transactions match the current filters.",
}: {
  message?: string;
}) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-white py-16 text-center"
    >
      <SearchX className="h-10 w-10 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-slate-900">Nothing to show</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
