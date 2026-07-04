import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/lib/roles";
import type { Session } from "next-auth";

/** Server-side guard: redirects to /sign-in when there is no session. */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return session;
}

/** Server-side guard: redirects to /forbidden when the role does not match. */
export async function requireRole(role: UserRole): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== role) redirect("/forbidden");
  return session;
}
