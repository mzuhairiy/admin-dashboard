import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { RevenueTrendChart } from "@/components/charts/revenue-trend-chart";
import { TopCategoriesChart } from "@/components/charts/top-categories-chart";
import { RevenueBreakdownChart } from "@/components/charts/revenue-breakdown-chart";
import { OrderStatusChart } from "@/components/charts/order-status-chart";
import { MonetaryChartTooltip } from "@/components/charts/monetary-chart-tooltip";
import { formatCurrency } from "@/lib/format";

afterEach(cleanup);

// jsdom has no layout; give ResponsiveContainer a fixed size so recharts renders.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
      <actual.ResponsiveContainer width={800} height={300}>
        {children}
      </actual.ResponsiveContainer>
    ),
  };
});

describe("RevenueTrendChart", () => {
  it("renders a data-value hook per data point", () => {
    const { container } = render(
      <RevenueTrendChart
        data={[
          { date: "2025-06-01", revenue: 100_000 },
          { date: "2025-06-02", revenue: 250_000 },
        ]}
      />,
    );
    expect(container.querySelector('[data-testid="chart-revenue-trend"]')).not.toBeNull();
    const points = container.querySelectorAll('[data-testid="chart-revenue-trend-point"]');
    expect(points).toHaveLength(2);
    expect(points[0].getAttribute("data-date")).toBe("2025-06-01");
    expect(points[0].getAttribute("data-value")).toBe("100000");
    expect(points[1].getAttribute("data-value")).toBe("250000");
  });
});

describe("TopCategoriesChart", () => {
  it("renders a data-value hook per bar", () => {
    const { container } = render(
      <TopCategoriesChart
        data={[
          { categoryName: "Books", categorySlug: "books", revenue: 500_000 },
          { categoryName: "Toys", categorySlug: "toys", revenue: 300_000 },
        ]}
      />,
    );
    const bars = container.querySelectorAll('[data-testid="chart-top-categories-bar"]');
    expect(bars).toHaveLength(2);
    expect(bars[0].getAttribute("data-category")).toBe("books");
    expect(bars[0].getAttribute("data-value")).toBe("500000");
  });
});

describe("OrderStatusChart", () => {
  it("renders a data-value hook per slice", () => {
    const { container } = render(
      <OrderStatusChart
        data={[
          { status: "PAID", count: 4250 },
          { status: "REFUNDED", count: 350 },
        ]}
      />,
    );
    const slices = container.querySelectorAll('[data-testid="chart-order-status-slice"]');
    expect(slices).toHaveLength(2);
    const byStatus = new Map(Array.from(slices).map((el) => [el.getAttribute("data-status"), el]));
    expect(byStatus.get("PAID")?.getAttribute("data-value")).toBe("4250");
    expect(byStatus.get("REFUNDED")?.getAttribute("data-value")).toBe("350");
  });
});

describe("MonetaryChartTooltip", () => {
  it.each(["IDR", "USD", "SGD"] as const)(
    "exposes a stable raw value and %s display text",
    (currency) => {
      const { getByTestId, rerender } = render(
        <MonetaryChartTooltip
          active
          currency={currency}
          label="2025-06-01"
          payload={[{ name: "Revenue", value: 1234567 }]}
        />,
      );
      const tooltip = getByTestId("chart-tooltip");
      const value = getByTestId("chart-tooltip-value");

      expect(tooltip).toHaveAttribute("data-currency", currency);
      expect(value).toHaveAttribute("data-raw-value", "1234567");
      expect(value).toHaveAttribute("data-currency", currency);
      expect(value.textContent).toBe(formatCurrency(1234567, currency));

      const nextCurrency = currency === "IDR" ? "USD" : "IDR";
      rerender(
        <MonetaryChartTooltip
          active
          currency={nextCurrency}
          label="2025-06-01"
          payload={[{ name: "Revenue", value: 1234567 }]}
        />,
      );
      expect(getByTestId("chart-tooltip-value")).toHaveAttribute("data-raw-value", "1234567");
      expect(getByTestId("chart-tooltip-value").textContent).toBe(
        formatCurrency(1234567, nextCurrency),
      );
    },
  );

  it("is absent until a monetary point is active", () => {
    const { queryByTestId, rerender } = render(
      <MonetaryChartTooltip active={false} currency="IDR" payload={[{ value: 42 }]} />,
    );
    expect(queryByTestId("chart-tooltip")).toBeNull();

    rerender(<MonetaryChartTooltip active currency="IDR" payload={[{ value: 42 }]} />);
    expect(queryByTestId("chart-tooltip")).toBeInTheDocument();
  });
});

describe("RevenueBreakdownChart", () => {
  it("renders monetary chart segments with raw values", () => {
    const { container } = render(
      <RevenueBreakdownChart
        currency="SGD"
        breakdown={{
          categoryNames: ["Books"],
          months: [
            { month: "2025-06", totalRevenue: 125000, orders: 5, byCategory: { Books: 125000 } },
          ],
        }}
      />,
    );
    const segment = container.querySelector('[data-testid="revenue-breakdown-segment"]');
    expect(segment).toHaveAttribute("data-value", "125000");
  });
});
