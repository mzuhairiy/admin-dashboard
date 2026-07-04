import { db } from "@/lib/db";

export interface CategoryOption {
  slug: string;
  name: string;
}

export async function listCategories(): Promise<CategoryOption[]> {
  return db.category.findMany({
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });
}
