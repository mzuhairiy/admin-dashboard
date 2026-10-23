import { formatCurrency, SUPPORTED_CURRENCIES } from "@/lib/format";

interface TooltipEntry {
  value?: unknown;
  name?: unknown;
}

interface MonetaryChartTooltipProps {
  active?: boolean;
  payload?: readonly TooltipEntry[];
  label?: unknown;
  currency?: string;
  labelFormatter?: (label: string) => string;
  nameFormatter?: (name: string) => string;
}

function supportedCurrency(currency = "IDR") {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(currency) ? currency : "IDR";
}

/** Shared tooltip for money charts. It formats display text without changing the plotted value. */
export function MonetaryChartTooltip({
  active,
  payload,
  label,
  currency,
  labelFormatter,
  nameFormatter,
}: MonetaryChartTooltipProps) {
  const safeCurrency = supportedCurrency(currency);
  const entries = payload?.filter(
    (entry) =>
      entry.value !== undefined && entry.value !== null && Number.isFinite(Number(entry.value)),
  );

  if (!active || !entries?.length) return null;

  return (
    <div data-testid="chart-tooltip" data-currency={safeCurrency} role="status" aria-live="polite">
      {label !== undefined && label !== null && (
        <p>{labelFormatter ? labelFormatter(String(label)) : String(label)}</p>
      )}
      {entries.map((entry, index) => {
        const rawValue = Number(entry.value);
        return (
          <div key={`${String(entry.name ?? "value")}-${index}`}>
            {entry.name !== undefined && (
              <span>
                {nameFormatter ? nameFormatter(String(entry.name)) : String(entry.name)}:{" "}
              </span>
            )}
            <span
              data-testid="chart-tooltip-value"
              data-raw-value={String(rawValue)}
              data-currency={safeCurrency}
            >
              {formatCurrency(rawValue, safeCurrency)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
