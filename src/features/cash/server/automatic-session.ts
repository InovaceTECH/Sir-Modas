import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { cashSessions } from "@/db/schema";

export async function getAutomaticCashSessionId(storeId: string) {
  const db = getDb();
  const [existing] = await db.select({ id: cashSessions.id }).from(cashSessions)
    .where(and(eq(cashSessions.storeId, storeId), eq(cashSessions.status, "open"))).limit(1);
  if (existing) return existing.id;

  try {
    const [created] = await db.insert(cashSessions).values({
      storeId,
      openingAmount: "0.00",
      openingNotes: "Sessão automática para registro financeiro",
    }).returning({ id: cashSessions.id });
    return created.id;
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code !== "23505") throw error;
    const [concurrent] = await db.select({ id: cashSessions.id }).from(cashSessions)
      .where(and(eq(cashSessions.storeId, storeId), eq(cashSessions.status, "open"))).limit(1);
    if (!concurrent) throw error;
    return concurrent.id;
  }
}
