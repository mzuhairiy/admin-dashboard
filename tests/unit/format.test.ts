import { describe, expect, it } from "vitest";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

describe("formatCurrency", () => {
  it("formats IDR with Indonesian grouping and no decimals", () => {
    const result = formatCurrency(1234567, "IDR");
    expect(result).toContain("Rp");
    expect(result).toContain("1.234.567");
  });

  it("formats USD as display-only (no conversion)", () => {
    expect(formatCurrency(350000, "USD")).toBe("$350,000");
  });

  it("formats SGD", () => {
    expect(formatCurrency(350000, "SGD")).toContain("350,000");
  });

  it("falls back to IDR for unknown currency codes", () => {
    expect(formatCurrency(1000, "XYZ")).toContain("Rp");
  });

  it("defaults to IDR", () => {
    expect(formatCurrency(0)).toContain("Rp");
  });
});

describe("formatNumber", () => {
  it("uses Indonesian grouping", () => {
    expect(formatNumber(5000)).toBe("5.000");
  });
});

describe("formatPercent", () => {
  it("renders one decimal place", () => {
    expect(formatPercent(6.1)).toBe("6.1%");
    expect(formatPercent(0)).toBe("0.0%");
    expect(formatPercent(12.35)).toBe("12.3%");
  });
});
