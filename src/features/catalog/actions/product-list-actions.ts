"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { products, productVariants } from "@/db/schema";

import { requireStore } from "../server/store-context";
import { generateProductCode } from "../product-code";

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
