import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { cashMovements, cashSessions } from "@/db/schema";

import { calculateExpectedCash } from "../domain/cash-balance";

export async function getOpenCashSession(storeId: string) {
  const [session] = await getDb().select().from(cashSessions)
    .where(and(eq(cashSessions.storeId, storeId), eq(cashSessions.status, "open")))
    .limit(1);
  if (!session) return null;

  const movements = await getDb().select().from(cashMovements)
    .where(eq(cashMovements.cashSessionId, session.id))
    .orderBy(desc(cashMovements.occurredAt));
  const expectedCash = calculateExpectedCash(Number(session.openingAmount), movements.map((movement) => ({ ...movement, amount: Number(movement.amount) })));
  const totals = movements.reduce<Record<string, number>>((result, movement) => {
    const key = movement.paymentMethod ?? movement.type;
    result[key] = (result[key] ?? 0) + Number(movement.amount);
    return result;
  }, {});
  return { session, movements, expectedCash, totals };
}

export async function getCashHistory(storeId: string, limit = 10) {
  return getDb().select({
    id: cashSessions.id,
    status: cashSessions.status,
    openingAmount: cashSessions.openingAmount,
    expectedCashAmount: cashSessions.expectedCashAmount,
    countedAmount: cashSessions.countedAmount,
    differenceAmount: cashSessions.differenceAmount,
    openedAt: cashSessions.openedAt,
    closedAt: cashSessions.closedAt,
    movementCount: sql<number>`count(${cashMovements.id})::int`,
  }).from(cashSessions)
    .leftJoin(cashMovements, eq(cashMovements.cashSessionId, cashSessions.id))
    .where(eq(cashSessions.storeId, storeId))
    .groupBy(cashSessions.id)
    .orderBy(desc(cashSessions.openedAt))
    .limit(limit);
}

export async function getFinancialMovements(storeId: string, limit = 100) {
  return getDb().select({
    id: cashMovements.id,
    type: cashMovements.type,
    amount: cashMovements.amount,
    paymentMethod: cashMovements.paymentMethod,
    reason: cashMovements.reason,
    notes: cashMovements.notes,
    occurredAt: cashMovements.occurredAt,
  }).from(cashMovements)
    .innerJoin(cashSessions, eq(cashSessions.id, cashMovements.cashSessionId))
    .where(eq(cashSessions.storeId, storeId))
    .orderBy(desc(cashMovements.occurredAt))
    .limit(limit);
}
