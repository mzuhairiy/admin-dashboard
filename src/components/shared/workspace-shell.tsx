"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, ReceiptText, Settings, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/roles";
import { UserMenu } from "@/components/shared/user-menu";

export interface ShellUser {
  name: string;
  email: string;
  role: UserRole;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", testId: "sidebar-dashboard", icon: LayoutDashboard },
  {
    href: "/transactions",
    label: "Transactions",
    testId: "sidebar-transactions",
    icon: ReceiptText,
  },
  {
    href: "/revenue",
    label: "Revenue",
    testId: "sidebar-revenue",
    icon: TrendingUp,
    managerOnly: true,
  },
  { href: "/settings", label: "Settings", testId: "sidebar-settings", icon: Settings },
];

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  transactions: "Transactions",
  revenue: "Revenue",
  settings: "Settings",
};

export function WorkspaceShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const segment = pathname.split("/")[1] ?? "";
  const breadcrumb = BREADCRUMB_LABELS[segment] ?? "Dashboard";
  const visibleNav = NAV_ITEMS.filter((item) => !item.managerOnly || user.role === "MANAGER");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        data-testid="sidebar"
        className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-slate-900 text-slate-100"
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
          <BarChart3 className="h-6 w-6 text-sky-400" aria-hidden />
          <span className="text-base font-semibold tracking-tight">Admin Dashboard</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={item.testId}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 px-5 py-3 text-xs text-slate-400">
          Signed in as <span className="font-medium text-slate-200">{user.role}</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <span>Admin</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-900">{breadcrumb}</span>
          </nav>
          <UserMenu user={user} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
