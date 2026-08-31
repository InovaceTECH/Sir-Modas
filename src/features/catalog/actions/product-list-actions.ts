"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import {
  exchangeItems,
  products,
  productVariants,
  saleItems,
  stockEntryItems,
  stockMovements,
} from "@/db/schema";

import { requireStore } from "../server/store-context";
import { generateProductCode } from "../product-code";

export type ProductListActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function toggleProductStatus(formData: FormData) {
  const { store } = await requireStore();
  if (!store) return;
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";
  await getDb().update(products).set({ active: !active, updatedAt: new Date() }).where(and(eq(products.id, id), eq(products.storeId, store.id)));
  revalidatePath("/produtos");
  revalidatePath("/estoque");
}

export async function duplicateProduct(formData: FormData) {
  const { store } = await requireStore();
  if (!store) return;
  const id = String(formData.get("id"));
  const db = getDb();
  const [source] = await db.select().from(products).where(and(eq(products.id, id), eq(products.storeId, store.id))).limit(1);
  if (!source) return;
  const variants = await db.select().from(productVariants).where(and(eq(productVariants.productId, source.id), eq(productVariants.active, true)));

  await db.transaction(async (tx) => {
    const [copy] = await tx.insert(products).values({
      ...source,
      id: undefined,
      internalCode: generateProductCode(),
      name: `${source.name} (cópia)`,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({ id: products.id });
    if (variants.length) await tx.insert(productVariants).values(variants.map((variant) => ({ productId: copy.id, color: variant.color, size: variant.size, internalCode: null, salePrice: variant.salePrice, quantityOnHand: 0 })));
  });
  revalidatePath("/produtos");
}

export async function deleteProduct(
  _state: ProductListActionState,
  formData: FormData,
): Promise<ProductListActionState> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return { status: "error", message: "Produto inválido." };
  }

  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Loja não configurada." };

  try {
    await getDb().transaction(async (tx) => {
      const [product] = await tx
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.id, id), eq(products.storeId, store.id)))
        .for("update")
        .limit(1);
      if (!product) throw new Error("PRODUCT_NOT_FOUND");

      const variants = await tx
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.productId, product.id))
        .for("update");
      const variantIds = variants.map((variant) => variant.id);

      if (variantIds.length > 0) {
        const [saleReference] = await tx.select({ id: saleItems.id }).from(saleItems)
          .where(inArray(saleItems.variantId, variantIds)).limit(1);
        const [exchangeReference] = await tx.select({ id: exchangeItems.id }).from(exchangeItems)
          .where(inArray(exchangeItems.variantId, variantIds)).limit(1);
        const [entryReference] = await tx.select({ id: stockEntryItems.id }).from(stockEntryItems)
          .where(inArray(stockEntryItems.variantId, variantIds)).limit(1);

        if (saleReference || exchangeReference || entryReference) {
          throw new Error("PRODUCT_HAS_HISTORY");
        }

        await tx.delete(stockMovements).where(inArray(stockMovements.variantId, variantIds));
        await tx.delete(productVariants).where(inArray(productVariants.id, variantIds));
      }

      await tx.delete(products).where(and(eq(products.id, product.id), eq(products.storeId, store.id)));
    }, { isolationLevel: "serializable" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "PRODUCT_HAS_HISTORY") {
      return {
        status: "error",
        message: "Este produto já possui vendas, trocas ou entradas de estoque. Inative-o para preservar o histórico.",
      };
    }
    if (message === "PRODUCT_NOT_FOUND") {
      return { status: "error", message: "Produto não encontrado." };
    }
    return { status: "error", message: "Não foi possível excluir o produto. Tente novamente." };
  }

  revalidatePath("/produtos");
  revalidatePath("/estoque");
  revalidatePath("/vendas/nova");
  revalidatePath("/trocas/nova");
  return { status: "success", message: "Produto excluído." };
}
