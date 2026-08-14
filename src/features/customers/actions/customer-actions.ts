"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { cashMovements, cashSessions, customers, receivablePayments, receivables } from "@/db/schema";
import { requireStore } from "@/features/catalog/server/store-context";

import { applyReceivablePayment, getReceivableStatus } from "../domain/receivable";
import { customerSchema, receivablePaymentSchema } from "../schemas/customer";

export type CustomerActionState = { status: "idle" | "success" | "error"; message?: string; errors?: Record<string, string[]> };
export const initialCustomerActionState: CustomerActionState = { status: "idle" };

function todayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

async function saveCustomer(_state: CustomerActionState, formData: FormData): Promise<CustomerActionState> {
  const parsed = customerSchema.safeParse({ id: formData.get("id") || undefined, name: formData.get("name"), phone: formData.get("phone"), birthDate: formData.get("birthDate"), address: formData.get("address"), notes: formData.get("notes") });
  if (!parsed.success) return { status: "error", message: "Revise os dados da cliente.", errors: parsed.error.flatten().fieldErrors };
  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Configure a loja antes de cadastrar clientes." };
  const values = { name: parsed.data.name, phone: parsed.data.phone, birthDate: parsed.data.birthDate ? new Date(`${parsed.data.birthDate}T12:00:00`) : null, address: parsed.data.address, notes: parsed.data.notes, updatedAt: new Date() };

  let customerId = parsed.data.id;
  if (customerId) {
    const [updated] = await getDb().update(customers).set(values).where(and(eq(customers.id, customerId), eq(customers.storeId, store.id))).returning({ id: customers.id });
    if (!updated) return { status: "error", message: "Cliente não encontrada." };
  } else {
    const [created] = await getDb().insert(customers).values({ storeId: store.id, ...values }).returning({ id: customers.id });
    customerId = created.id;
  }
  revalidatePath("/clientes");
  revalidatePath("/vendas/nova");
  redirect(`/clientes/${customerId}`);
}

export async function createCustomer(state: CustomerActionState, formData: FormData) { return saveCustomer(state, formData); }
export async function updateCustomer(state: CustomerActionState, formData: FormData) { return saveCustomer(state, formData); }

export async function receivePayment(_state: CustomerActionState, formData: FormData): Promise<CustomerActionState> {
  const parsed = receivablePaymentSchema.safeParse({ receivableId: formData.get("receivableId"), amount: formData.get("amount"), method: formData.get("method"), idempotencyKey: formData.get("idempotencyKey"), notes: formData.get("notes") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Revise o recebimento." };
  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Loja não configurada." };

  try {
    const duplicate = await getDb().transaction(async (tx) => {
      const [existing] = await tx.select({ id: receivablePayments.id }).from(receivablePayments).where(eq(receivablePayments.idempotencyKey, parsed.data.idempotencyKey)).limit(1);
      if (existing) return true;
      const [account] = await tx.select({ id: receivables.id, customerId: receivables.customerId, paidAmount: receivables.paidAmount, remainingAmount: receivables.remainingAmount, dueDate: receivables.dueDate, status: receivables.status })
        .from(receivables).innerJoin(customers, eq(customers.id, receivables.customerId))
        .where(and(eq(receivables.id, parsed.data.receivableId), eq(customers.storeId, store.id))).for("update").limit(1);
      if (!account || account.status === "cancelled" || account.status === "paid") throw new Error("INVALID_RECEIVABLE");
      const [cash] = await tx.select({ id: cashSessions.id }).from(cashSessions)
        .where(and(eq(cashSessions.storeId, store.id), eq(cashSessions.status, "open"))).for("update").limit(1);
      if (!cash) throw new Error("NO_OPEN_CASH");

      const next = applyReceivablePayment(account.remainingAmount, account.paidAmount, parsed.data.amount);
      const status = getReceivableStatus(next.remainingAmount, next.paidAmount, account.dueDate, todayInSaoPaulo());
      const [payment] = await tx.insert(receivablePayments).values({ receivableId: account.id, amount: parsed.data.amount.toFixed(2), method: parsed.data.method, idempotencyKey: parsed.data.idempotencyKey, notes: parsed.data.notes }).returning({ id: receivablePayments.id });
      await tx.update(receivables).set({ paidAmount: next.paidAmount, remainingAmount: next.remainingAmount, status }).where(eq(receivables.id, account.id));
      await tx.insert(cashMovements).values({ cashSessionId: cash.id, type: "receivable_payment", amount: parsed.data.amount.toFixed(2), paymentMethod: parsed.data.method, reason: "Recebimento de fiado", referenceType: "receivable_payment", referenceId: payment.id, notes: parsed.data.notes });
      return false;
    }, { isolationLevel: "serializable" });
    revalidatePath("/", "layout");
    return { status: "success", message: duplicate ? "Este recebimento já havia sido registrado." : "Pagamento registrado e lançado no caixa." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NO_OPEN_CASH") return { status: "error", message: "Abra o caixa antes de receber um pagamento." };
    if (message === "INVALID_PAYMENT_AMOUNT") return { status: "error", message: "O valor deve ser maior que zero e não pode ultrapassar o saldo." };
    if (message === "INVALID_RECEIVABLE") return { status: "error", message: "Esta conta não está disponível para recebimento." };
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "23505") return { status: "success", message: "Este recebimento já havia sido registrado." };
    return { status: "error", message: "Não foi possível registrar o pagamento." };
  }
}
