"use server";

import { and, eq, notInArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { categories, productTypes, products, productVariants, stockMovements, suppliers } from "@/db/schema";

import { productSchema, type ProductInput } from "../schemas/product";
import { requireStore } from "../server/store-context";
import { generateProductCode } from "../product-code";

export type ProductFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: Record<string, string[]>;
};

export const initialProductFormState: ProductFormState = { status: "idle" };

function readProduct(formData: FormData) {
  let variants: unknown = [];
  try {
    variants = JSON.parse(String(formData.get("variants") ?? "[]"));
  } catch {
    return { success: false as const, message: "Não foi possível ler as variações." };
  }

  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    categoryName: formData.get("categoryName"),
    productTypeId: formData.get("productTypeId"),
    productTypeName: formData.get("productTypeName"),
    supplierId: formData.get("supplierId"),
    supplierName: formData.get("supplierName"),
    supplierPhone: formData.get("supplierPhone"),
    supplierNotes: formData.get("supplierNotes"),
    brand: formData.get("brand"),
    description: formData.get("description"),
    notes: formData.get("notes"),
    photoUrl: formData.get("photoUrl"),
    costPrice: formData.get("costPrice"),
    salePrice: formData.get("salePrice"),
    minimumStock: formData.get("minimumStock"),
    variants,
  });

  if (!parsed.success) {
    return { success: false as const, message: "Revise os dados do produto.", errors: parsed.error.flatten().fieldErrors };
  }
  return { success: true as const, data: parsed.data };
}

async function saveProduct(input: ProductInput, storeId: string) {
  return getDb().transaction(async (tx) => {
    const category = input.categoryId
      ? await tx.query.categories.findFirst({ where: and(eq(categories.id, input.categoryId), eq(categories.storeId, storeId), eq(categories.active, true)), columns: { id: true } })
      : (await tx.insert(categories).values({ storeId, name: input.categoryName! }).onConflictDoUpdate({ target: [categories.storeId, categories.name], set: { active: true } }).returning({ id: categories.id }))[0];
    const productType = input.productTypeId
      ? await tx.query.productTypes.findFirst({ where: and(eq(productTypes.id, input.productTypeId), eq(productTypes.storeId, storeId), eq(productTypes.active, true)), columns: { id: true } })
      : (await tx.insert(productTypes).values({ storeId, name: input.productTypeName! }).onConflictDoUpdate({ target: [productTypes.storeId, productTypes.name], set: { active: true } }).returning({ id: productTypes.id }))[0];
    if (!category || !productType) throw new Error("CATALOG_OPTION_NOT_FOUND");

    let supplierId: string | null = null;
    if (input.supplierId) {
      const supplier = await tx.query.suppliers.findFirst({
        where: and(eq(suppliers.id, input.supplierId), eq(suppliers.storeId, storeId), eq(suppliers.active, true)),
        columns: { id: true },
      });
      if (!supplier) throw new Error("CATALOG_OPTION_NOT_FOUND");
      supplierId = supplier.id;
    } else if (input.supplierName) {
      const [existing] = await tx.select({ id: suppliers.id }).from(suppliers)
        .where(and(eq(suppliers.storeId, storeId), sql`lower(${suppliers.name}) = lower(${input.supplierName})`)).limit(1);
      if (existing) supplierId = existing.id;
      else {
        const [created] = await tx.insert(suppliers).values({
          storeId,
          name: input.supplierName,
          phone: input.supplierPhone,
          notes: input.supplierNotes,
        }).returning({ id: suppliers.id });
        supplierId = created.id;
      }
    }

    const productValues = {
      storeId,
      categoryId: category.id,
      productTypeId: productType.id,
      supplierId,
      name: input.name,
      description: input.description,
      brand: input.brand,
      costPrice: input.costPrice.toFixed(2),
      salePrice: input.salePrice.toFixed(2),
      minimumStock: input.minimumStock,
      notes: input.notes,
      photoUrl: input.photoUrl,
      updatedAt: new Date(),
    };

    if (!input.id) {
      const [created] = await tx.insert(products).values({ ...productValues, internalCode: generateProductCode() }).returning({ id: products.id });
      for (const variant of input.variants) {
        const [createdVariant] = await tx.insert(productVariants).values({
          productId: created.id,
          color: variant.color,
          size: variant.size,
          quantityOnHand: variant.initialQuantity,
        }).returning({ id: productVariants.id });
        if (variant.initialQuantity > 0) {
          await tx.insert(stockMovements).values({ storeId, variantId: createdVariant.id, type: "initial", quantityDelta: variant.initialQuantity, quantityBefore: 0, quantityAfter: variant.initialQuantity, reason: "Estoque inicial do produto" });
        }
      }
      return created.id;
    }

    const [owned] = await tx.select({ id: products.id }).from(products)
      .where(and(eq(products.id, input.id), eq(products.storeId, storeId))).limit(1);
    if (!owned) throw new Error("PRODUCT_NOT_FOUND");

    await tx.update(products).set(productValues).where(eq(products.id, input.id));
    const retainedIds = input.variants.flatMap((variant) => variant.id ? [variant.id] : []);
    if (retainedIds.length) {
      await tx.update(productVariants).set({ active: false, updatedAt: new Date() })
        .where(and(eq(productVariants.productId, input.id), notInArray(productVariants.id, retainedIds)));
    } else {
      await tx.update(productVariants).set({ active: false, updatedAt: new Date() }).where(eq(productVariants.productId, input.id));
    }

    for (const variant of input.variants) {
      if (variant.id) {
        await tx.update(productVariants).set({ color: variant.color, size: variant.size, active: true, updatedAt: new Date() })
          .where(and(eq(productVariants.id, variant.id), eq(productVariants.productId, input.id)));
      } else {
        const [createdVariant] = await tx.insert(productVariants).values({ productId: input.id, color: variant.color, size: variant.size, quantityOnHand: variant.initialQuantity }).returning({ id: productVariants.id });
        if (variant.initialQuantity > 0) await tx.insert(stockMovements).values({ storeId, variantId: createdVariant.id, type: "initial", quantityDelta: variant.initialQuantity, quantityBefore: 0, quantityAfter: variant.initialQuantity, reason: "Nova variação do produto" });
      }
    }
    return input.id;
  });
}

async function executeSave(_state: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const parsed = readProduct(formData);
  if (!parsed.success) return { status: "error", message: parsed.message, errors: parsed.errors as Record<string, string[]> | undefined };

  const { store } = await requireStore();
  if (!store) return { status: "error", message: "Configure os dados da loja antes de cadastrar produtos." };

  try {
    await saveProduct(parsed.data, store.id);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "23505") return { status: "error", message: "Já existe uma variação com essa cor e tamanho." };
    return { status: "error", message: "Não foi possível salvar o produto." };
  }

  revalidatePath("/produtos");
  revalidatePath("/estoque");
  redirect("/produtos");
}

export async function createProduct(state: ProductFormState, formData: FormData) {
  return executeSave(state, formData);
}

export async function updateProduct(state: ProductFormState, formData: FormData) {
  return executeSave(state, formData);
}
