"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { products, productVariants, stockEntries, stockEntryItems, stockMovements, suppliers } from "@/db/schema";
import { requireStore } from "@/features/catalog/server/store-context";

import { stockAdjustmentSchema, stockEntrySchema } from "../schemas/stock-operation";

export type StockActionState = { status: "idle" | "error"; message?: string };

export async function createStockEntry(_state: StockActionState, formData: FormData): Promise<StockActionState> {
  let items: unknown = [];
  try { items = JSON.parse(String(formData.get("items") ?? "[]")); }
  catch { return { status: "error", message: "Não foi possível ler os itens da entrada." }; }

  const parsed = stockEntrySchema.safeParse({ supplierName: formData.get("supplierName"), documentNumber: formData.get("documentNumber"), notes: formData.get("notes"), items });
  if (!parsed.success) return { status: "error", message: "Revise os itens, quantidades e valores da entrada." };
  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Configure a loja antes de registrar entradas." };

  try {
    await getDb().transaction(async (tx) => {
      let supplierId: string | null = null;
      if (parsed.data.supplierName) {
        const [existing] = await tx.select({ id: suppliers.id }).from(suppliers).where(and(eq(suppliers.storeId, store.id), eq(suppliers.name, parsed.data.supplierName))).limit(1);
        supplierId = existing?.id ?? null;
        if (!supplierId) {
          const [created] = await tx.insert(suppliers).values({ storeId: store.id, name: parsed.data.supplierName }).returning({ id: suppliers.id });
          supplierId = created.id;
        }
      }

      const [entry] = await tx.insert(stockEntries).values({ storeId: store.id, supplierId, status: "confirmed", documentNumber: parsed.data.documentNumber, notes: parsed.data.notes, confirmedAt: new Date() }).returning({ id: stockEntries.id });

      for (const item of parsed.data.items) {
        const [variant] = await tx.select({ id: productVariants.id, quantity: productVariants.quantityOnHand, productId: products.id })
          .from(productVariants).innerJoin(products, eq(products.id, productVariants.productId))
          .where(and(eq(productVariants.id, item.variantId), eq(products.storeId, store.id))).for("update").limit(1);
        if (!variant) throw new Error("VARIANT_NOT_FOUND");
        const after = variant.quantity + item.quantity;
        await tx.insert(stockEntryItems).values({ stockEntryId: entry.id, variantId: variant.id, quantity: item.quantity, unitCost: item.unitCost.toFixed(2), salePrice: item.salePrice?.toFixed(2) });
        await tx.update(productVariants).set({ quantityOnHand: after, ...(item.updateSalePrice && item.salePrice ? { salePrice: item.salePrice.toFixed(2) } : {}), updatedAt: new Date() }).where(eq(productVariants.id, variant.id));
        await tx.update(products).set({ costPrice: item.unitCost.toFixed(2), updatedAt: new Date() }).where(eq(products.id, variant.productId));
        await tx.insert(stockMovements).values({ storeId: store.id, variantId: variant.id, type: "entry", quantityDelta: item.quantity, quantityBefore: variant.quantity, quantityAfter: after, referenceType: "stock_entry", referenceId: entry.id, reason: parsed.data.documentNumber ? `Entrada ${parsed.data.documentNumber}` : "Entrada de mercadoria" });
      }
    }, { isolationLevel: "serializable" });
  } catch {
    return { status: "error", message: "Não foi possível confirmar a entrada. Nenhum saldo foi alterado." };
  }

  revalidatePath("/estoque");
  revalidatePath("/produtos");
  redirect("/estoque");
}

export async function adjustStock(_state: StockActionState, formData: FormData): Promise<StockActionState> {
  const parsed = stockAdjustmentSchema.safeParse({ variantId: formData.get("variantId"), countedQuantity: formData.get("countedQuantity"), reason: formData.get("reason") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Revise o ajuste." };
  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Configure a loja antes de ajustar o estoque." };

  try {
    await getDb().transaction(async (tx) => {
      const [variant] = await tx.select({ id: productVariants.id, quantity: productVariants.quantityOnHand })
        .from(productVariants).innerJoin(products, eq(products.id, productVariants.productId))
        .where(and(eq(productVariants.id, parsed.data.variantId), eq(products.storeId, store.id))).for("update").limit(1);
      if (!variant) throw new Error("VARIANT_NOT_FOUND");
      const delta = parsed.data.countedQuantity - variant.quantity;
      if (delta === 0) throw new Error("NO_CHANGE");
      await tx.update(productVariants).set({ quantityOnHand: parsed.data.countedQuantity, updatedAt: new Date() }).where(eq(productVariants.id, variant.id));
      await tx.insert(stockMovements).values({ storeId: store.id, variantId: variant.id, type: delta > 0 ? "adjustment_in" : "adjustment_out", quantityDelta: delta, quantityBefore: variant.quantity, quantityAfter: parsed.data.countedQuantity, reason: parsed.data.reason });
    }, { isolationLevel: "serializable" });
  } catch (error) {
    return { status: "error", message: error instanceof Error && error.message === "NO_CHANGE" ? "A quantidade contada é igual ao saldo atual." : "Não foi possível registrar o ajuste." };
  }

  revalidatePath("/estoque");
  revalidatePath("/produtos");
  redirect("/estoque");
}
