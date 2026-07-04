import { z } from "zod";

export const PAGE_SIZES = [20, 50, 100] as const;

export const SORT_COLUMNS = ["id", "date", "customer", "category", "amount", "status"] as const;
export type SortColumn = (typeof SORT_COLUMNS)[number];
export type SortOrder = "asc" | "desc";

export interface TableParams {
  page: number;
  pageSize: (typeof PAGE_SIZES)[number];
  sort: SortColumn;
  order: SortOrder;
}

export const tableSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce
    .number()
    .refine((n): n is (typeof PAGE_SIZES)[number] =>
      (PAGE_SIZES as readonly number[]).includes(n),
    )
    .catch(20)
    .default(20),
  sort: z.enum(SORT_COLUMNS).catch("date").default("date"),
  order: z.enum(["asc", "desc"]).catch("desc").default("desc"),
});

/** Parse pagination/sort params from URL search params; invalid values fall back to defaults. */
export function resolveTableParams(
  raw: Record<string, string | string[] | undefined>,
): TableParams {
  const flat = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
  const parsed = tableSearchParamsSchema.safeParse(flat);
  if (parsed.success) return parsed.data as TableParams;
  return { page: 1, pageSize: 20, sort: "date", order: "desc" };
}
