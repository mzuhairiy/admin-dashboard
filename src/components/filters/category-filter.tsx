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
import type { CategoryOption } from "@/server/services/category";
import { useFilterParams } from "@/components/filters/use-filter-params";

interface CategoryFilterProps {
  categories: CategoryOption[];
  selected: string[];
}

export function CategoryFilter({ categories, selected }: CategoryFilterProps) {
  const { setParams } = useFilterParams();

  const toggle = (slug: string, checked: boolean) => {
    const next = checked ? [...selected, slug] : selected.filter((s) => s !== slug);
    setParams({ category: next.length ? next.join(",") : null });
  };

  const label =
    selected.length === 0
      ? "All categories"
      : selected.length === 1
        ? (categories.find((c) => c.slug === selected[0])?.name ?? selected[0])
        : `${selected.length} categories`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" data-testid="filter-category" className="bg-white">
          {label}
          <ChevronDown className="ml-2 h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Category</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {categories.map((category) => (
          <DropdownMenuCheckboxItem
            key={category.slug}
            data-testid={`filter-category-${category.slug}`}
            checked={selected.includes(category.slug)}
            onCheckedChange={(checked) => toggle(category.slug, checked === true)}
            onSelect={(e) => e.preventDefault()}
          >
            {category.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
