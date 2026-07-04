import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { canAccessPath } from "@/lib/roles";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  if (!session?.user) {
    const signInUrl = new URL("/sign-in", nextUrl);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  if (!canAccessPath(session.user.role, nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/forbidden", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/revenue/:path*",
    "/settings/:path*",
  ],
};
