"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { signInSchema } from "@/schemas/auth";

type SignInResult = { error: string } | undefined;

export async function signInAction(values: unknown, callbackUrl?: string): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  // Only allow internal redirect targets.
  const redirectTo = callbackUrl?.startsWith("/") ? callbackUrl : "/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      return { error: "Invalid email or password." };
    }
    throw error; // rethrow NEXT_REDIRECT (successful sign-in) and unexpected errors
  }
  return undefined;
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/sign-in" });
}
