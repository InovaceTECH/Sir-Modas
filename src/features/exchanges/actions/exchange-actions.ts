"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { cashMovements, exchangeItems, exchanges, products, productVariants, saleItems, sales, stockMovements } from "@/db/schema";
import { requireStore } from "@/features/catalog/server/store-context";
import { getAutomaticCashSessionId } from "@/features/cash/server/automatic-session";
import { fromCents, toCents } from "@/features/sales/domain/money";

import { isOutsideExchangeDeadline } from "../domain/exchange";
import { exchangeSchema } from "../schemas/exchange";

export type ExchangeActionState = { status: "idle" | "error"; message?: string };

export async function createExchange(_state: ExchangeActionState, formData: FormData): Promise<ExchangeActionState> {
  const parsed = exchangeSchema.safeParse({ saleId: formData.get("saleId"), returnedVariantId: formData.get("returnedVariantId"), returnedQuantity: formData.get("returnedQuantity"), returnedCondition: formData.get("returnedCondition"), deliveredVariantId: formData.get("deliveredVariantId"), deliveredQuantity: formData.get("deliveredQuantity"), reason: formData.get("reason"), paymentMethod: formData.get("paymentMethod") || undefined, notes: formData.get("notes") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Revise os dados da troca." };
  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Configure a loja antes de registrar trocas." };

  let exchangeId = "";
  try {
    const cashSessionId = await getAutomaticCashSessionId(store.id);
    await getDb().transaction(async (tx) => {
      const [sale] = await tx.select().from(sales).where(and(eq(sales.id, parsed.data.saleId), eq(sales.storeId, store.id))).for("update").limit(1);
      if (!sale || sale.status !== "confirmed") throw new Error("INVALID_SALE");

      const variants = await tx.select({ id: productVariants.id, stock: productVariants.quantityOnHand, productName: products.name, color: productVariants.color, size: productVariants.size, price: sql<string>`coalesce(${productVariants.salePrice}, ${products.salePrice})` })
        .from(productVariants).innerJoin(products, eq(products.id, productVariants.productId))
        .where(and(inArray(productVariants.id, [parsed.data.returnedVariantId, parsed.data.deliveredVariantId]), eq(products.storeId, store.id))).for("update");
      const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
      const returnedVariant = variantMap.get(parsed.data.returnedVariantId);
      const deliveredVariant = variantMap.get(parsed.data.deliveredVariantId);
      if (!returnedVariant || !deliveredVariant) throw new Error("INVALID_VARIANT");

      const originalItems = await tx.select({ variantId: saleItems.variantId, quantity: saleItems.quantity, unitPrice: saleItems.unitPrice }).from(saleItems).where(eq(saleItems.saleId, sale.id));
      const soldItems = originalItems.filter((item) => item.variantId === parsed.data.returnedVariantId);
      const soldQuantity = soldItems.reduce((sum, item) => sum + item.quantity, 0);
      if (!soldQuantity) throw new Error("ITEM_NOT_FROM_SALE");
      const priorReturns = await tx.select({ quantity: exchangeItems.quantity }).from(exchangeItems).innerJoin(exchanges, eq(exchanges.id, exchangeItems.exchangeId))
        .where(and(eq(exchanges.saleId, sale.id), eq(exchanges.status, "confirmed"), eq(exchangeItems.direction, "returned"), eq(exchangeItems.variantId, parsed.data.returnedVariantId)));
      const alreadyReturned = priorReturns.reduce((sum, item) => sum + item.quantity, 0);
      if (parsed.data.returnedQuantity > soldQuantity - alreadyReturned) throw new Error("RETURN_QUANTITY_EXCEEDED");
      if (parsed.data.deliveredQuantity > deliveredVariant.stock + (parsed.data.returnedCondition === "sellable" && returnedVariant.id === deliveredVariant.id ? parsed.data.returnedQuantity : 0)) throw new Error("INSUFFICIENT_STOCK");

      const returnedUnitPrice = soldItems[0].unitPrice;
      const differenceCents = toCents(deliveredVariant.price) * parsed.data.deliveredQuantity - toCents(returnedUnitPrice) * parsed.data.returnedQuantity;
      if (differenceCents !== 0 && !parsed.data.paymentMethod) throw new Error("MISSING_PAYMENT_METHOD");

      const [exchange] = await tx.insert(exchanges).values({ saleId: sale.id, reason: parsed.data.reason, outsideDeadline: isOutsideExchangeDeadline(sale.soldAt, store.exchangeDeadlineDays), differenceAmount: fromCents(differenceCents), notes: parsed.data.notes }).returning({ id: exchanges.id });
      exchangeId = exchange.id;
      const returnedToStock = parsed.data.returnedCondition === "sellable";
      await tx.insert(exchangeItems).values([
        { exchangeId: exchange.id, variantId: returnedVariant.id, direction: "returned", quantity: parsed.data.returnedQuantity, unitPrice: returnedUnitPrice, returnedToStock },
        { exchangeId: exchange.id, variantId: deliveredVariant.id, direction: "delivered", quantity: parsed.data.deliveredQuantity, unitPrice: deliveredVariant.price, returnedToStock: false },
      ]);

      if (returnedToStock) {
        const [current] = await tx.select().from(productVariants).where(eq(productVariants.id, returnedVariant.id)).for("update").limit(1);
        const after = current.quantityOnHand + parsed.data.returnedQuantity;
        await tx.update(productVariants).set({ quantityOnHand: after, updatedAt: new Date() }).where(eq(productVariants.id, current.id));
        await tx.insert(stockMovements).values({ storeId: store.id, variantId: current.id, type: "exchange_in", quantityDelta: parsed.data.returnedQuantity, quantityBefore: current.quantityOnHand, quantityAfter: after, referenceType: "exchange", referenceId: exchange.id, reason: parsed.data.reason });
      }

      const [currentDelivered] = await tx.select().from(productVariants).where(eq(productVariants.id, deliveredVariant.id)).for("update").limit(1);
      if (currentDelivered.quantityOnHand < parsed.data.deliveredQuantity) throw new Error("INSUFFICIENT_STOCK");
      const deliveredAfter = currentDelivered.quantityOnHand - parsed.data.deliveredQuantity;
      await tx.update(productVariants).set({ quantityOnHand: deliveredAfter, updatedAt: new Date() }).where(eq(productVariants.id, currentDelivered.id));
      await tx.insert(stockMovements).values({ storeId: store.id, variantId: currentDelivered.id, type: "exchange_out", quantityDelta: -parsed.data.deliveredQuantity, quantityBefore: currentDelivered.quantityOnHand, quantityAfter: deliveredAfter, referenceType: "exchange", referenceId: exchange.id, reason: parsed.data.reason });

      if (differenceCents > 0 && parsed.data.paymentMethod) {
        await tx.insert(cashMovements).values({ cashSessionId, type: "adjustment", amount: fromCents(differenceCents), paymentMethod: parsed.data.paymentMethod, reason: "Diferença de troca", referenceType: "exchange", referenceId: exchange.id, notes: parsed.data.notes });
      }
      if (differenceCents < 0 && parsed.data.paymentMethod) {
        await tx.insert(cashMovements).values({ cashSessionId, type: "withdrawal", amount: fromCents(-differenceCents), paymentMethod: parsed.data.paymentMethod, reason: "Reembolso de troca", referenceType: "exchange", referenceId: exchange.id, notes: parsed.data.notes });
      }
    }, { isolationLevel: "serializable" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "MISSING_PAYMENT_METHOD") return { status: "error", message: "Informe a forma de pagamento ou reembolso da diferença." };
    if (message === "RETURN_QUANTITY_EXCEEDED") return { status: "error", message: "A quantidade devolvida supera o saldo disponível desta venda." };
    if (message === "INSUFFICIENT_STOCK") return { status: "error", message: "Não há estoque suficiente do novo produto." };
    if (message === "ITEM_NOT_FROM_SALE") return { status: "error", message: "O produto devolvido não pertence à venda original." };
    return { status: "error", message: "Não foi possível concluir a troca. Nenhum estoque foi alterado." };
  }
  revalidatePath("/", "layout");
  redirect(`/trocas/${exchangeId}`);
}
