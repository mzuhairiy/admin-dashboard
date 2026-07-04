export const SUPPORTED_CURRENCIES = ["IDR", "USD", "SGD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const CURRENCY_LOCALES: Record<SupportedCurrency, string> = {
  IDR: "id-ID",
  USD: "en-US",
  SGD: "en-SG",
};

function asSupportedCurrency(currency: string): SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(currency)
    ? (currency as SupportedCurrency)
    : "IDR";
}

/**
 * Display-format an integer amount in the chosen currency.
 * NOTE: no exchange-rate conversion — the currency preference changes the
 * display format only (per PROJECT_PLAN section 4, Settings).
 */
export function formatCurrency(amount: number, currency: string = "IDR"): string {
  const safeCurrency = asSupportedCurrency(currency);
  return new Intl.NumberFormat(CURRENCY_LOCALES[safeCurrency], {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

/** Percentage with one decimal, e.g. 7.0% */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
