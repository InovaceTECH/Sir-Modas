"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { cashMovements, cashSessions } from "@/db/schema";
import { requireStore } from "@/features/catalog/server/store-context";

import { calculateExpectedCash } from "../domain/cash-balance";
import { cashMovementSchema, closeCashSchema, openCashSchema } from "../schemas/cash-operation";

export type CashActionState = { status: "idle" | "success" | "error"; message?: string };
export const initialCashActionState: CashActionState = { status: "idle" };

export async function openCash(_state: CashActionState, formData: FormData): Promise<CashActionState> {
  const parsed = openCashSchema.safeParse({ openingAmount: formData.get("openingAmount"), openingNotes: formData.get("openingNotes") });
  if (!parsed.success) return { status: "error", message: "Informe um valor inicial válido." };
  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Configure a loja antes de abrir o caixa." };
  try {
    await getDb().insert(cashSessions).values({ storeId: store.id, openingAmount: parsed.data.openingAmount.toFixed(2), openingNotes: parsed.data.openingNotes });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    return { status: "error", message: code === "23505" ? "Já existe um caixa aberto." : "Não foi possível abrir o caixa." };
  }
  revalidatePath("/caixa"); revalidatePath("/inicio"); revalidatePath("/vendas/nova");
  return { status: "success", message: "Caixa aberto com sucesso." };
}

export async function addCashMovement(_state: CashActionState, formData: FormData): Promise<CashActionState> {
  const parsed = cashMovementSchema.safeParse({ type: formData.get("type"), amount: formData.get("amount"), reason: formData.get("reason"), notes: formData.get("notes") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Revise a movimentação." };
  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Loja não configurada." };
  const [open] = await getDb().select({ id: cashSessions.id }).from(cashSessions).where(and(eq(cashSessions.storeId, store.id), eq(cashSessions.status, "open"))).limit(1);
  if (!open) return { status: "error", message: "Abra o caixa antes de registrar movimentações." };
  await getDb().insert(cashMovements).values({ cashSessionId: open.id, type: parsed.data.type, amount: parsed.data.amount.toFixed(2), reason: parsed.data.reason, notes: parsed.data.notes });
  revalidatePath("/caixa"); revalidatePath("/inicio");
  return { status: "success", message: "Movimentação registrada." };
}

export async function closeCash(_state: CashActionState, formData: FormData): Promise<CashActionState> {
  const parsed = closeCashSchema.safeParse({ countedAmount: formData.get("countedAmount"), closingNotes: formData.get("closingNotes") });
  if (!parsed.success) return { status: "error", message: "Informe o valor contado corretamente." };
  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Loja não configurada." };
  try {
    await getDb().transaction(async (tx) => {
      const [session] = await tx.select().from(cashSessions).where(and(eq(cashSessions.storeId, store.id), eq(cashSessions.status, "open"))).for("update").limit(1);
      if (!session) throw new Error("NO_OPEN_CASH");
      const movements = await tx.select().from(cashMovements).where(eq(cashMovements.cashSessionId, session.id));
      const expected = calculateExpectedCash(Number(session.openingAmount), movements.map((movement) => ({ ...movement, amount: Number(movement.amount) })));
      const difference = parsed.data.countedAmount - expected;
      await tx.update(cashSessions).set({ status: "closed", countedAmount: parsed.data.countedAmount.toFixed(2), expectedCashAmount: expected.toFixed(2), differenceAmount: difference.toFixed(2), closingNotes: parsed.data.closingNotes, closedAt: new Date() }).where(eq(cashSessions.id, session.id));
    }, { isolationLevel: "serializable" });
  } catch (error) {
    return { status: "error", message: error instanceof Error && error.message === "NO_OPEN_CASH" ? "Nenhum caixa aberto." : "Não foi possível fechar o caixa." };
  }
  revalidatePath("/caixa"); revalidatePath("/inicio"); revalidatePath("/vendas/nova");
  return { status: "success", message: "Caixa fechado e conferido." };
}
