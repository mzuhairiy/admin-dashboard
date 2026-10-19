import { isDatabaseReady } from "@/server/services/health";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const ready = await isDatabaseReady();
  return Response.json(
    { status: ready ? "ok" : "unavailable" },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
