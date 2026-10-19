import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { canExportCsv } from "@/lib/roles";
import { csvFilename, generateTransactionsCsv } from "@/lib/csv";
import { resolveFilters } from "@/schemas/filters";
import { resolveTableParams } from "@/schemas/table";
import { listTransactionsForExport } from "@/server/services/transaction";
import { getUserPrefs } from "@/server/services/user";

export async function GET(request: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canExportCsv(session.user.role)) {
    return NextResponse.json({ error: "Forbidden: MANAGER role required" }, { status: 403 });
  }

  // App Router pages resolve repeated parameters using their first value.
  const query = request.nextUrl.searchParams;
  const raw = Object.fromEntries(Array.from(query.keys(), (key) => [key, query.get(key)!]));
  const prefs = await getUserPrefs(session.user.id);
  const filters = resolveFilters(raw, prefs.timezone);
  const { sort, order } = resolveTableParams(raw);

  const rows = await listTransactionsForExport(filters, sort, order);
  const csv = generateTransactionsCsv(rows, filters.tz);
  const filename = csvFilename(filters.fromDate, filters.toDate, filters.tz);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
