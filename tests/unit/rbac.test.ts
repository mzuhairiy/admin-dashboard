import { describe, expect, it } from "vitest";
import {
  canAccessPath,
  canExportCsv,
  getRoleHomePath,
  isManagerOnlyPath,
} from "@/lib/roles";

describe("isManagerOnlyPath", () => {
  it("marks /revenue and nested paths as manager-only", () => {
    expect(isManagerOnlyPath("/revenue")).toBe(true);
    expect(isManagerOnlyPath("/revenue/detail")).toBe(true);
  });

  it("does not match unrelated paths or prefixes", () => {
    expect(isManagerOnlyPath("/dashboard")).toBe(false);
    expect(isManagerOnlyPath("/revenue-x")).toBe(false);
  });
});

describe("canAccessPath", () => {
  it("blocks VIEWER from /revenue", () => {
    expect(canAccessPath("VIEWER", "/revenue")).toBe(false);
    expect(canAccessPath("VIEWER", "/revenue/detail")).toBe(false);
  });

  it("allows MANAGER everywhere", () => {
    expect(canAccessPath("MANAGER", "/revenue")).toBe(true);
    expect(canAccessPath("MANAGER", "/dashboard")).toBe(true);
  });

  it("allows VIEWER on shared pages", () => {
    expect(canAccessPath("VIEWER", "/dashboard")).toBe(true);
    expect(canAccessPath("VIEWER", "/transactions")).toBe(true);
    expect(canAccessPath("VIEWER", "/settings")).toBe(true);
  });
});

describe("canExportCsv", () => {
  it("is MANAGER-only", () => {
    expect(canExportCsv("MANAGER")).toBe(true);
    expect(canExportCsv("VIEWER")).toBe(false);
  });
});

describe("getRoleHomePath", () => {
  it("sends both roles to /dashboard", () => {
    expect(getRoleHomePath("VIEWER")).toBe("/dashboard");
    expect(getRoleHomePath("MANAGER")).toBe("/dashboard");
  });
});
