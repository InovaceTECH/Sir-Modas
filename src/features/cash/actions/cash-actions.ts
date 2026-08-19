"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { cashMovements } from "@/db/schema";
import { requireStore } from "@/features/catalog/server/store-context";

import { cashMovementSchema } from "../schemas/cash-operation";
import { getAutomaticCashSessionId } from "../server/automatic-session";

export type CashActionState = { status: "idle" | "success" | "error"; message?: string };

export async function addCashMovement(_state: CashActionState, formData: FormData): Promise<CashActionState> {
  const parsed = cashMovementSchema.safeParse({ type: formData.get("type"), amount: formData.get("amount"), reason: formData.get("reason"), notes: formData.get("notes") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Revise a movimentação." };
  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Loja não configurada." };

  try {
    const cashSessionId = await getAutomaticCashSessionId(store.id);
    await getDb().insert(cashMovements).values({ cashSessionId, type: parsed.data.type, amount: parsed.data.amount.toFixed(2), reason: parsed.data.reason, notes: parsed.data.notes });
  } catch {
    return { status: "error", message: "Não foi possível registrar a movimentação." };
  }

  revalidatePath("/caixa");
  revalidatePath("/inicio");
  return { status: "success", message: "Movimentação registrada." };
}
