import "server-only";

import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";

import { getDb } from "@/db";
import { cashSessions, categories, productVariants, products, saleItems, salePayments, sales } from "@/db/schema";

export async function getSaleCatalog(storeId: string) {
  return getDb().select({
    variantId: productVariants.id,
    productName: products.name,
    productCode: products.internalCode,
    color: productVariants.color,
    size: productVariants.size,
    stock: productVariants.quantityOnHand,
    price: products.salePrice,
    category: categories.name,
  }).from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.storeId, storeId), eq(products.active, true), eq(productVariants.active, true)))
    .orderBy(products.name, productVariants.color, productVariants.size);
}

export async function getSales(storeId: string, query = "", status = "all", limit = 50) {
  const filters = [eq(sales.storeId, storeId)];
  if (status === "confirmed" || status === "cancelled") filters.push(eq(sales.status, status));
  if (query.trim()) filters.push(or(ilike(sales.number, `%${query.trim()}%`), ilike(sales.source, `%${query.trim()}%`))!);
  return getDb().select().from(sales).where(and(...filters)).orderBy(desc(sales.soldAt)).limit(limit);
}

export async function getSaleDetails(storeId: string, saleId: string) {
  const [sale] = await getDb().select().from(sales).where(and(eq(sales.id, saleId), eq(sales.storeId, storeId))).limit(1);
  if (!sale) return null;
  const [items, payments, cash] = await Promise.all([
    getDb().select().from(saleItems).where(eq(saleItems.saleId, sale.id)),
    getDb().select().from(salePayments).where(eq(salePayments.saleId, sale.id)),
    getDb().select({ status: cashSessions.status, openedAt: cashSessions.openedAt, closedAt: cashSessions.closedAt }).from(cashSessions).where(eq(cashSessions.id, sale.cashSessionId)).limit(1),
  ]);
  return { sale, items, payments, cash: cash[0] ?? null };
}

export async function getSalesSummary(storeId: string, saleIds: string[]) {
  if (!saleIds.length) return [];
  return getDb().select({ saleId: saleItems.saleId, quantity: saleItems.quantity }).from(saleItems).where(inArray(saleItems.saleId, saleIds));
}
