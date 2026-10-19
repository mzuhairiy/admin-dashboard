import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DateRangeFilter } from "@/components/filters/date-range-filter";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/revenue",
  useSearchParams: () => new URLSearchParams("tz=UTC&category=books&page=2"),
}));

describe("Revenue date preset selection", () => {
  it("writes 30d explicitly while preserving filters and resetting pagination", () => {
    render(<DateRangeFilter preset="1y" fromDate="2025-01-02" toDate="2026-01-01" />);
    fireEvent.click(screen.getByTestId("date-preset-30d"));
    const destination = new URL(push.mock.lastCall![0], "http://localhost");
    expect(destination.pathname).toBe("/revenue");
    expect(Object.fromEntries(destination.searchParams)).toEqual({
      tz: "UTC",
      category: "books",
      preset: "30d",
    });
  });
});
