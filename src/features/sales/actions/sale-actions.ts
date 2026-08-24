"use server";

import { randomUUID } from "node:crypto";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { cashMovements, customers, products, productVariants, receivables, saleItems, salePayments, sales, stockMovements } from "@/db/schema";
import { requireStore } from "@/features/catalog/server/store-context";
import { getAutomaticCashSessionId } from "@/features/cash/server/automatic-session";

import { assertPaymentMatchesTotal, fromCents, toCents } from "../domain/money";
import { cancelSaleSchema, saleSchema } from "../schemas/sale";

export type SaleActionState = { status: "idle" | "success" | "error"; message?: string };

function parseJson(formData: FormData, key: string) {
  try { return JSON.parse(String(formData.get(key) ?? "[]")); }
  catch { return []; }
}

function makeSaleNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `SM-${date}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function createSale(_state: SaleActionState, formData: FormData): Promise<SaleActionState> {
  const parsed = saleSchema.safeParse({ source: formData.get("source"), customerId: formData.get("customerId"), dueDate: formData.get("dueDate"), discountAmount: formData.get("discountAmount"), notes: formData.get("notes"), items: parseJson(formData, "items"), payments: parseJson(formData, "payments") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Revise os dados da venda." };
  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Configure a loja antes de vender." };

  let saleId = "";
  try {
    const cashSessionId = await getAutomaticCashSessionId(store.id);
    await getDb().transaction(async (tx) => {
      if (parsed.data.customerId) {
        const [customer] = await tx.select({ id: customers.id }).from(customers).where(and(eq(customers.id, parsed.data.customerId), eq(customers.storeId, store.id))).limit(1);
        if (!customer) throw new Error("INVALID_CUSTOMER");
      }

      const requestedIds = parsed.data.items.map((item) => item.variantId);
      const variants = await tx.select({ id: productVariants.id, stock: productVariants.quantityOnHand, color: productVariants.color, size: productVariants.size, productName: products.name, price: products.salePrice })
        .from(productVariants).innerJoin(products, eq(products.id, productVariants.productId))
        .where(and(inArray(productVariants.id, requestedIds), eq(products.storeId, store.id), eq(products.active, true), eq(productVariants.active, true))).for("update");
      if (variants.length !== requestedIds.length) throw new Error("INVALID_VARIANT");

      const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
      let subtotalCents = 0;
      for (const item of parsed.data.items) {
        const variant = variantMap.get(item.variantId)!;
        if (item.quantity > variant.stock) throw new Error(`INSUFFICIENT_STOCK:${variant.productName} ${variant.color} ${variant.size}`);
        subtotalCents += toCents(variant.price) * item.quantity;
      }
      const discountCents = toCents(parsed.data.discountAmount);
      if (discountCents > subtotalCents) throw new Error("INVALID_DISCOUNT");
      const totalCents = subtotalCents - discountCents;
      const paymentCents = parsed.data.payments.reduce((sum, payment) => sum + toCents(payment.amount), 0);
      assertPaymentMatchesTotal(totalCents, paymentCents);

      const [sale] = await tx.insert(sales).values({ storeId: store.id, cashSessionId, customerId: parsed.data.customerId, number: makeSaleNumber(), source: parsed.data.source, subtotal: fromCents(subtotalCents), discountAmount: fromCents(discountCents), totalAmount: fromCents(totalCents), notes: parsed.data.notes }).returning({ id: sales.id });
      saleId = sale.id;

      for (const item of parsed.data.items) {
        const variant = variantMap.get(item.variantId)!;
        const itemTotal = toCents(variant.price) * item.quantity;
        const after = variant.stock - item.quantity;
        await tx.insert(saleItems).values({ saleId: sale.id, variantId: variant.id, productNameSnapshot: variant.productName, variantSnapshot: `${variant.color} · ${variant.size}`, quantity: item.quantity, unitPrice: variant.price, totalAmount: fromCents(itemTotal) });
        await tx.update(productVariants).set({ quantityOnHand: after, updatedAt: new Date() }).where(eq(productVariants.id, variant.id));
        await tx.insert(stockMovements).values({ storeId: store.id, variantId: variant.id, type: "sale", quantityDelta: -item.quantity, quantityBefore: variant.stock, quantityAfter: after, referenceType: "sale", referenceId: sale.id, reason: `Venda ${sale.id.slice(0, 8)}` });
      }

      let onAccountCents = 0;
      for (const payment of parsed.data.payments) {
        await tx.insert(salePayments).values({ saleId: sale.id, method: payment.method, amount: payment.amount.toFixed(2), installments: payment.method === "credit_card" ? payment.installments ?? 1 : null });
        if (payment.method === "on_account") onAccountCents += toCents(payment.amount);
        else await tx.insert(cashMovements).values({ cashSessionId, type: "sale", amount: payment.amount.toFixed(2), paymentMethod: payment.method, reason: "Venda", referenceType: "sale", referenceId: sale.id });
      }
      if (onAccountCents > 0) {
        if (!parsed.data.customerId || !parsed.data.dueDate) throw new Error("MISSING_RECEIVABLE_DATA");
        await tx.insert(receivables).values({ customerId: parsed.data.customerId, saleId: sale.id, originalAmount: fromCents(onAccountCents), remainingAmount: fromCents(onAccountCents), dueDate: parsed.data.dueDate, notes: parsed.data.notes });
      }
    }, { isolationLevel: "serializable" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "INVALID_CUSTOMER" || message === "MISSING_RECEIVABLE_DATA") return { status: "error", message: "Selecione uma cliente e informe o vencimento para vender no fiado." };
    if (message.startsWith("INSUFFICIENT_STOCK:")) return { status: "error", message: `Estoque insuficiente para ${message.split(":")[1]}.` };
    if (message === "PAYMENT_MISMATCH") return { status: "error", message: "A soma dos pagamentos deve ser igual ao total da venda." };
    if (message === "INVALID_DISCOUNT") return { status: "error", message: "O desconto não pode ser maior que o subtotal." };
    return { status: "error", message: "Não foi possível concluir a venda. Nenhum dado foi alterado." };
  }

  revalidatePath("/", "layout");
  redirect(`/vendas/${saleId}`);
}

export async function cancelSale(_state: SaleActionState, formData: FormData): Promise<SaleActionState> {
  const parsed = cancelSaleSchema.safeParse({ saleId: formData.get("saleId"), reason: formData.get("reason") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Revise o cancelamento." };
  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Loja não configurada." };
  try {
    const cashSessionId = await getAutomaticCashSessionId(store.id);
    await getDb().transaction(async (tx) => {
      const [sale] = await tx.select().from(sales).where(and(eq(sales.id, parsed.data.saleId), eq(sales.storeId, store.id))).for("update").limit(1);
      if (!sale || sale.status === "cancelled") throw new Error("INVALID_SALE");
      const accounts = await tx.select().from(receivables).where(eq(receivables.saleId, sale.id)).for("update");
      if (accounts.some((account) => Number(account.paidAmount) > 0)) throw new Error("RECEIVABLE_HAS_PAYMENTS");
      const items = await tx.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
      for (const item of items) {
        const [variant] = await tx.select().from(productVariants).where(eq(productVariants.id, item.variantId)).for("update").limit(1);
        if (!variant) throw new Error("INVALID_VARIANT");
        const after = variant.quantityOnHand + item.quantity;
        await tx.update(productVariants).set({ quantityOnHand: after, updatedAt: new Date() }).where(eq(productVariants.id, variant.id));
        await tx.insert(stockMovements).values({ storeId: store.id, variantId: variant.id, type: "sale_cancellation", quantityDelta: item.quantity, quantityBefore: variant.quantityOnHand, quantityAfter: after, referenceType: "sale", referenceId: sale.id, reason: parsed.data.reason });
      }
      const payments = await tx.select().from(salePayments).where(eq(salePayments.saleId, sale.id));
      for (const payment of payments) if (payment.method !== "on_account") await tx.insert(cashMovements).values({ cashSessionId, type: "cancellation", amount: payment.amount, paymentMethod: payment.method, reason: `Cancelamento ${sale.number}`, referenceType: "sale", referenceId: sale.id, notes: parsed.data.reason });
      if (accounts.length) await tx.update(receivables).set({ status: "cancelled" }).where(eq(receivables.saleId, sale.id));
      await tx.update(sales).set({ status: "cancelled", cancelledAt: new Date(), cancellationReason: parsed.data.reason }).where(eq(sales.id, sale.id));
    }, { isolationLevel: "serializable" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "RECEIVABLE_HAS_PAYMENTS") return { status: "error", message: "Esta venda fiada já possui recebimentos. Faça o ajuste financeiro antes de cancelar." };
    return { status: "error", message: "Não foi possível cancelar a venda." };
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "Venda cancelada. Estoque e financeiro foram estornados." };
}

export async function archiveCancelledSale(_state: SaleActionState, formData: FormData): Promise<SaleActionState> {
  const saleId = String(formData.get("saleId") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saleId)) {
    return { status: "error", message: "Venda inválida." };
  }
  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Loja não configurada." };

  try {
    await getDb().transaction(async (tx) => {
      const [sale] = await tx.select({ id: sales.id, status: sales.status, archivedAt: sales.archivedAt }).from(sales)
        .where(and(eq(sales.id, saleId), eq(sales.storeId, store.id))).for("update").limit(1);
      if (!sale) throw new Error("INVALID_SALE");
      if (sale.status !== "cancelled") throw new Error("SALE_NOT_CANCELLED");
      if (sale.archivedAt) return;
      await tx.update(sales).set({ archivedAt: new Date() }).where(eq(sales.id, sale.id));
    }, { isolationLevel: "serializable" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "SALE_NOT_CANCELLED") return { status: "error", message: "Cancele a venda antes de removê-la do histórico." };
    return { status: "error", message: "Não foi possível remover a venda do histórico." };
  }

  revalidatePath("/", "layout");
  redirect("/vendas");
}
