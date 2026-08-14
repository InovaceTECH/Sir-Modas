import { sql } from "drizzle-orm";

import { getDb } from "@/db";
import { getSetupStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const setup = getSetupStatus();
  if (!setup.ready) return Response.json({ status: "configuration_error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable", database: "disconnected" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
