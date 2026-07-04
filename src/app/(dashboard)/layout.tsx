import { requireSession } from "@/lib/rbac";
import { WorkspaceShell } from "@/components/shared/workspace-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <WorkspaceShell
      user={{
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        role: session.user.role,
      }}
    >
      {children}
    </WorkspaceShell>
  );
}
