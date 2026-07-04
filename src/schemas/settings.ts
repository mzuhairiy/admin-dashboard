import { z } from "zod";
import { SETTINGS_TIMEZONES } from "@/lib/timezone";
import { SUPPORTED_CURRENCIES } from "@/lib/format";

export const settingsSchema = z.object({
  timezone: z.enum(SETTINGS_TIMEZONES),
  currency: z.enum(SUPPORTED_CURRENCIES),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
