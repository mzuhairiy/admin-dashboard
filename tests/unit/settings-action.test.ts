import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const updatePrefsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/server/services/user", () => ({ updateUserPrefs: updatePrefsMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateSettingsAction } from "@/server/actions/settings";

describe("updateSettingsAction", () => {
  beforeEach(() => {
    authMock.mockReset();
    updatePrefsMock.mockReset();
  });

  it("rejects unauthenticated calls", async () => {
    authMock.mockResolvedValue(null);
    const result = await updateSettingsAction({ timezone: "UTC", currency: "IDR" });
    expect(result).toEqual({ success: false, error: "Not authenticated." });
    expect(updatePrefsMock).not.toHaveBeenCalled();
  });

  it("rejects invalid timezone/currency via Zod", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "VIEWER" } });
    const result = await updateSettingsAction({ timezone: "Mars/Olympus", currency: "IDR" });
    expect(result.success).toBe(false);
    expect(updatePrefsMock).not.toHaveBeenCalled();
  });

  it("updates prefs for the SESSION user id (never from the payload)", async () => {
    authMock.mockResolvedValue({ user: { id: "session-user", role: "VIEWER" } });
    const result = await updateSettingsAction({
      timezone: "Asia/Tokyo",
      currency: "USD",
      userId: "attacker-supplied", // must be ignored
    });
    expect(result).toEqual({ success: true });
    expect(updatePrefsMock).toHaveBeenCalledWith("session-user", {
      timezone: "Asia/Tokyo",
      currency: "USD",
    });
  });
});
