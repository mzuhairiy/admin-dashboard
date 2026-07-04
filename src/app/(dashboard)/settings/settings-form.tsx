"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SETTINGS_TIMEZONES } from "@/lib/timezone";
import { SUPPORTED_CURRENCIES } from "@/lib/format";
import { updateSettingsAction } from "@/server/actions/settings";

interface SettingsFormProps {
  defaultTimezone: string;
  defaultCurrency: string;
}

export function SettingsForm({ defaultTimezone, defaultCurrency }: SettingsFormProps) {
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateSettingsAction({ timezone, currency });
      if (result.success) {
        toast.success(<span data-testid="settings-saved-toast">Settings saved</span>);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form data-testid="settings-form" onSubmit={onSubmit} className="max-w-md space-y-6">
      <div className="space-y-2">
        <Label htmlFor="timezone-select">Default timezone</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger id="timezone-select" data-testid="timezone-select" className="bg-white">
            <SelectValue placeholder="Timezone" />
          </SelectTrigger>
          <SelectContent>
            {SETTINGS_TIMEZONES.map((tz) => (
              <SelectItem
                key={tz}
                value={tz}
                data-testid={`timezone-option-${tz.replace(/\//g, "-").toLowerCase()}`}
              >
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Used as the default for date filters and displayed dates.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency-select">Currency display</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger id="currency-select" data-testid="currency-select" className="bg-white">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRENCIES.map((code) => (
              <SelectItem key={code} value={code} data-testid={`currency-option-${code.toLowerCase()}`}>
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Display format only — amounts are not converted between currencies.
        </p>
      </div>

      {error ? (
        <p data-testid="settings-error" role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} data-testid="settings-save-button">
        {isPending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
