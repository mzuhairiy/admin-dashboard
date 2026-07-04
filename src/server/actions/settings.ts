"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { settingsSchema } from "@/schemas/settings";
import { updateUserPrefs } from "@/server/services/user";

type UpdateSettingsResult = { success: true } | { success: false; error: string };

export async function updateSettingsAction(values: unknown): Promise<UpdateSettingsResult> {
  // userId always comes from the session, never from the client payload.
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Not authenticated." };
  }

  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid timezone or currency." };
  }

  await updateUserPrefs(session.user.id, parsed.data);
  revalidatePath("/", "layout"); // default timezone/currency feed every page
  return { success: true };
}
