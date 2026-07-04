import { describe, expect, it } from "vitest";
import { bucketMonthlyCategoryRevenue } from "@/server/services/revenue";

describe("bucketMonthlyCategoryRevenue", () => {
  const rows = [
    // 2025-01-31T18:00Z = 2025-02-01 01:00 in Asia/Jakarta → February there, January in UTC
    { createdAt: new Date("2025-01-31T18:00:00Z"), amount: 100, categoryName: "Books", status: "PAID" },
    { createdAt: new Date("2025-01-10T00:00:00Z"), amount: 50, categoryName: "Toys", status: "PAID" },
    { createdAt: new Date("2025-01-11T00:00:00Z"), amount: 70, categoryName: "Books", status: "PAID" },
    { createdAt: new Date("2025-01-12T00:00:00Z"), amount: 999, categoryName: "Books", status: "REFUNDED" },
  ];

  it("groups PAID revenue per month and category in the given timezone", () => {
    const result = bucketMonthlyCategoryRevenue(rows, "UTC");
    expect(result.months).toHaveLength(1);
    expect(result.months[0].month).toBe("2025-01");
    expect(result.months[0].byCategory).toEqual({ Books: 170, Toys: 50 });
    expect(result.months[0].totalRevenue).toBe(220);
    expect(result.months[0].orders).toBe(4); // orders count every status
    expect(result.categoryNames).toEqual(["Books", "Toys"]);
  });

  it("assigns boundary instants to the month of the selected timezone", () => {
    const result = bucketMonthlyCategoryRevenue(rows, "Asia/Jakarta");
    expect(result.months.map((m) => m.month)).toEqual(["2025-01", "2025-02"]);
    const february = result.months.find((m) => m.month === "2025-02");
    expect(february?.byCategory).toEqual({ Books: 100 });
  });

  it("excludes non-PAID amounts from revenue but keeps them in order counts", () => {
    const result = bucketMonthlyCategoryRevenue(
      [{ createdAt: new Date("2025-03-01T00:00:00Z"), amount: 500, categoryName: "Books", status: "CANCELLED" }],
      "UTC",
    );
    expect(result.months[0].totalRevenue).toBe(0);
    expect(result.months[0].orders).toBe(1);
    expect(result.categoryNames).toEqual([]);
  });
});
