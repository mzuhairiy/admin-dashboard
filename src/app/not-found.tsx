import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      data-testid="not-found-page"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center"
    >
      <FileQuestion className="h-16 w-16 text-muted-foreground" aria-hidden />
      <h1 className="text-3xl font-bold text-slate-900">404 — Page not found</h1>
      <p className="max-w-md text-sm text-slate-500">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild data-testid="not-found-home-link">
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </main>
  );
}
