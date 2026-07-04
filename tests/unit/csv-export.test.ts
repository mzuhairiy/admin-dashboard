import { describe, expect, it } from "vitest";
import { csvFilename, generateTransactionsCsv, CSV_HEADERS } from "@/lib/csv";
import type { TransactionRow } from "@/server/services/transaction";

function mockRow(overrides: Partial<TransactionRow>): TransactionRow {
  return {
    externalId: "TX-2025-000001",
    createdAt: new Date("2025-06-15T10:30:00Z"),
    customerName: "Budi Santoso",
    customerCity: "Jakarta",
    categoryName: "Electronics",
    amount: 350000,
    status: "PAID",
    ...overrides,
  };
}

const FIVE_ROWS: TransactionRow[] = [
  mockRow({ externalId: "TX-2025-000001", amount: 100000 }),
  mockRow({
    externalId: "TX-2025-000002",
    customerName: 'Smith, John "JJ"', // comma + quotes must be escaped
    amount: 200000,
  }),
  mockRow({ externalId: "TX-2025-000003", categoryName: "Food & Beverage", amount: 300000 }),
  mockRow({
    externalId: "TX-2025-000004",
    createdAt: new Date("2025-12-31T17:30:00Z"),
    status: "REFUNDED",
    amount: 400000,
  }),
  mockRow({ externalId: "TX-2025-000005", amount: 500000 }),
];

describe("generateTransactionsCsv", () => {
  const csv = generateTransactionsCsv(FIVE_ROWS, "Asia/Jakarta");
  const lines = csv.split("\n");

  it("emits the exact header row", () => {
    expect(lines[0]).toBe(
      'Transaction ID,Date (ISO UTC),Date (Local),Customer,Category,Amount,Status',
    );
    expect(CSV_HEADERS).toHaveLength(7);
  });

  it("emits one line per transaction in the given order (row N in CSV = row N in table)", () => {
    expect(lines).toHaveLength(6); // header + 5 rows
    expect(lines[1].startsWith("TX-2025-000001,")).toBe(true);
    expect(lines[5].startsWith("TX-2025-000005,")).toBe(true);
  });

  it("escapes commas and quotes in customer names", () => {
    expect(lines[2]).toContain('"Smith, John ""JJ"""');
  });

  it("contains both ISO UTC and localized dates", () => {
    // 2025-06-15T10:30:00Z = 17:30 in Asia/Jakarta (UTC+7)
    expect(lines[1]).toContain("2025-06-15T10:30:00.000Z");
    expect(lines[1]).toContain("2025-06-15 17:30:00");
    // 2025-12-31T17:30:00Z crosses midnight into 2026-01-01 00:30 Jakarta time
    expect(lines[4]).toContain("2025-12-31T17:30:00.000Z");
    expect(lines[4]).toContain("2026-01-01 00:30:00");
  });

  it("writes raw integer amounts and status", () => {
    expect(lines[1]).toContain(",100000,PAID");
    expect(lines[4]).toContain(",400000,REFUNDED");
  });

  it("localizes dates to the requested timezone", () => {
    const csvTokyo = generateTransactionsCsv([FIVE_ROWS[0]], "Asia/Tokyo");
    expect(csvTokyo).toContain("2025-06-15 19:30:00"); // UTC+9
    expect(csvTokyo).toContain("2025-06-15T10:30:00.000Z"); // ISO unchanged
  });
});

describe("csvFilename", () => {
  it("is deterministic and filesystem-safe", () => {
    expect(csvFilename("2025-12-03", "2026-01-01", "Asia/Jakarta")).toBe(
      "transactions-2025-12-03-2026-01-01-Asia-Jakarta.csv",
    );
    expect(csvFilename("2025-01-01", "2025-01-31", "UTC")).toBe(
      "transactions-2025-01-01-2025-01-31-UTC.csv",
    );
  });
});
