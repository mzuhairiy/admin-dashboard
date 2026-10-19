import { describe, expect, it } from "vitest";
import { resolveSignInRedirect } from "@/lib/auth-redirect";

describe("sign-in redirect", () => {
  it("preserves a local deep link and its filters", () => {
    const path = "/transactions?tz=UTC&category=books&status=PAID&page=2";
    expect(resolveSignInRedirect(path)).toBe(path);
  });

  it.each([
    undefined,
    null,
    42,
    ["/transactions"],
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/\t/example.com",
    "/\n/example.com",
  ])("rejects unsafe callback %j", (value) => {
    expect(resolveSignInRedirect(value)).toBe("/dashboard");
  });
});
