import { db } from "@/lib/db";
import { DEFAULT_CURRENCY, DEFAULT_TIMEZONE } from "@/lib/constants";

export interface UserPrefs {
  timezone: string;
  currency: string;
}

export async function getUserPrefs(userId: string): Promise<UserPrefs> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true, currency: true },
  });
  return {
    timezone: user?.timezone ?? DEFAULT_TIMEZONE,
    currency: user?.currency ?? DEFAULT_CURRENCY,
  };
}

export async function updateUserPrefs(userId: string, prefs: UserPrefs): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { timezone: prefs.timezone, currency: prefs.currency },
  });
}
