import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/server/services/transaction", () => ({
  listTransactionsForExport: vi.fn().mockResolvedValue([
    {
      externalId: "TX-2025-000001",
      createdAt: new Date("2025-06-15T10:30:00Z"),
      customerName: "Budi",
      customerCity: "Jakarta",
      categoryName: "Books",
      amount: 100000,
      status: "PAID",
    },
  ]),
}));
vi.mock("@/server/services/user", () => ({
  getUserPrefs: vi.fn().mockResolvedValue({ timezone: "Asia/Jakarta", currency: "IDR" }),
}));

import { GET } from "@/app/api/export/csv/route";
import { listTransactionsForExport } from "@/server/services/transaction";
import { resolveFilters } from "@/schemas/filters";

function makeRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost:3000/api/export/csv${query}`);
}

describe("GET /api/export/csv RBAC", () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("returns 403 for VIEWER", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "VIEWER" } });
    const response = await GET(makeRequest());
    expect(response.status).toBe(403);
  });

  it("returns 200 with CSV attachment for MANAGER", async () => {
    authMock.mockResolvedValue({ user: { id: "u2", role: "MANAGER" } });
    const response = await GET(makeRequest("?tz=UTC&preset=7d"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="transactions-2025-12-26-2026-01-01-UTC.csv"',
    );
    const body = await response.text();
    expect(body.split("\n")[0]).toContain("Transaction ID");
    expect(body).toContain("TX-2025-000001");
  });

  it("uses the same first repeated query values as the table", async () => {
    authMock.mockResolvedValue({ user: { id: "u2", role: "MANAGER" } });
    await GET(
      makeRequest(
        "?tz=UTC&tz=Asia/Tokyo&status=REFUNDED&status=PAID&sort=amount&sort=date&order=asc&order=desc",
      ),
    );
    expect(listTransactionsForExport).toHaveBeenLastCalledWith(
      resolveFilters({ tz: ["UTC", "Asia/Tokyo"], status: ["REFUNDED", "PAID"] }),
      "amount",
      "asc",
    );
  });
});
