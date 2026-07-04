import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/rbac";
import { getUserPrefs } from "@/server/services/user";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await requireSession();
  const prefs = await getUserPrefs(session.user.id);

  return (
    <div data-testid="settings-page" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {session.user.email} ({session.user.role})
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
          <CardDescription>Defaults applied across the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm defaultTimezone={prefs.timezone} defaultCurrency={prefs.currency} />
        </CardContent>
      </Card>
    </div>
  );
}
