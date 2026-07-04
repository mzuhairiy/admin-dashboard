// Role helpers kept free of Prisma imports so middleware (edge) can use them.
export type UserRole = "VIEWER" | "MANAGER";

const MANAGER_ONLY_PREFIXES = ["/revenue"];

export function isManagerOnlyPath(pathname: string): boolean {
  return MANAGER_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  if (isManagerOnlyPath(pathname)) return role === "MANAGER";
  return true;
}

export function canExportCsv(role: UserRole): boolean {
  return role === "MANAGER";
}

// Both roles land on the dashboard after sign-in.
const HOME_PATHS: Record<UserRole, string> = {
  VIEWER: "/dashboard",
  MANAGER: "/dashboard",
};

export function getRoleHomePath(role: UserRole): string {
  return HOME_PATHS[role];
}
