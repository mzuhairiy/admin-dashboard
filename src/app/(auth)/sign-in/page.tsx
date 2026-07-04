import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoleHomePath } from "@/lib/roles";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign In",
};

interface SignInPageProps {
  searchParams: { callbackUrl?: string };
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  if (session?.user) redirect(getRoleHomePath(session.user.role));

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to view analytics</p>
        </div>
        <SignInForm callbackUrl={searchParams.callbackUrl} />
      </div>
    </main>
  );
}
