import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Prisma / bcrypt) shared by middleware and the full auth setup.
export const authConfig = {
  // Local/self-hosted SUT — the Host header is trusted (required outside Vercel).
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
