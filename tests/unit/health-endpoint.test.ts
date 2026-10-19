import { beforeEach, describe, expect, it, vi } from "vitest";

const isDatabaseReadyMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/services/health", () => ({ isDatabaseReady: isDatabaseReadyMock }));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => isDatabaseReadyMock.mockReset());

  it("reports healthy only when the database responds", async () => {
    isDatabaseReadyMock.mockResolvedValue(true);
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns 503 while the database is unavailable", async () => {
    isDatabaseReadyMock.mockResolvedValue(false);
    const response = await GET();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "unavailable" });
  });
});
