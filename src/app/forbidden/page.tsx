import type { Metadata } from "next";
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "403 Forbidden",
};

export default function ForbiddenPage() {
  return (
    <main
      data-testid="forbidden-page"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center"
    >
      <ShieldX className="h-16 w-16 text-destructive" aria-hidden />
      <h1 className="text-3xl font-bold text-slate-900">403 — Forbidden</h1>
      <p className="max-w-md text-sm text-slate-500">
        You don&apos;t have permission to access this page. It requires the MANAGER role.
      </p>
      <Button asChild data-testid="forbidden-back-link">
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </main>
  );
}
