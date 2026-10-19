import { db } from "@/lib/db";

export async function isDatabaseReady(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
