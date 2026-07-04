"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInAction } from "@/server/actions/auth";
import { signInSchema, type SignInInput } from "@/schemas/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await signInAction(values, callbackUrl);
      if (result?.error) setServerError(result.error);
    });
  });

  const fieldError = form.formState.errors.email?.message ?? form.formState.errors.password?.message;
  const errorMessage = fieldError ?? serverError;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your seeded account credentials</CardDescription>
      </CardHeader>
      <CardContent>
        <form data-testid="sign-in-form" onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="viewer@example.com"
              data-testid="sign-in-email"
              {...form.register("email")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              data-testid="sign-in-password"
              {...form.register("password")}
            />
          </div>
          {errorMessage ? (
            <p data-testid="sign-in-error" role="alert" className="text-sm font-medium text-destructive">
              {errorMessage}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isPending} data-testid="sign-in-submit">
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
