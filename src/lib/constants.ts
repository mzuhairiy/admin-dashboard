/**
 * Fixed "now" reference — the SUT is deterministic: seed data covers the 365 days
 * before this instant, and all relative date presets (7d/30d/…) anchor to it.
 * Never use `new Date()` for business logic; use FIXED_NOW.
 */
export const FIXED_NOW = new Date("2026-01-01T00:00:00Z");

export const DEFAULT_TIMEZONE = "Asia/Jakarta";
export const DEFAULT_CURRENCY = "IDR";
