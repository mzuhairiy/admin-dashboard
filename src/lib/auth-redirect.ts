/** Accept only a local absolute path, preserving deep-link filters after sign-in. */
export function resolveSignInRedirect(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  ) {
    return "/dashboard";
  }

  const base = "https://dashboard.invalid";
  try {
    const target = new URL(value, base);
    if (target.origin !== base) return "/dashboard";
    return target.pathname + target.search + target.hash;
  } catch {
    return "/dashboard";
  }
}
