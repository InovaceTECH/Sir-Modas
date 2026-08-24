import "server-only";

import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { categories, customers, productVariants, products, saleItems, salePayments, sales } from "@/db/schema";

export async function getSaleCatalog(storeId: string) {
  return getDb().select({
    variantId: productVariants.id,
    productName: products.name,
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
  const filters = [eq(sales.storeId, storeId), isNull(sales.archivedAt)];
  if (status === "confirmed" || status === "cancelled") filters.push(eq(sales.status, status));
  if (query.trim()) filters.push(or(
    ilike(sales.number, `%${query.trim()}%`),
    ilike(sales.source, `%${query.trim()}%`),
    sql`exists (select 1 from ${customers} c where c.id = ${sales.customerId} and c.name ilike ${`%${query.trim()}%`})`,
    sql`exists (select 1 from ${saleItems} i where i.sale_id = ${sales.id} and i.product_name_snapshot ilike ${`%${query.trim()}%`})`,
  )!);
  return getDb().select({
    id: sales.id,
    number: sales.number,
    status: sales.status,
    source: sales.source,
    totalAmount: sales.totalAmount,
    soldAt: sales.soldAt,
    customerName: customers.name,
  }).from(sales)
    .leftJoin(customers, eq(customers.id, sales.customerId))
    .where(and(...filters)).orderBy(desc(sales.soldAt)).limit(limit);
}

export async function getSaleDetails(storeId: string, saleId: string) {
  const [sale] = await getDb().select().from(sales).where(and(eq(sales.id, saleId), eq(sales.storeId, storeId))).limit(1);
  if (!sale) return null;
  const [items, payments, customerRows] = await Promise.all([
    getDb().select().from(saleItems).where(eq(saleItems.saleId, sale.id)),
    getDb().select().from(salePayments).where(eq(salePayments.saleId, sale.id)),
    sale.customerId
      ? getDb().select({ id: customers.id, name: customers.name, phone: customers.phone }).from(customers)
        .where(and(eq(customers.id, sale.customerId), eq(customers.storeId, storeId))).limit(1)
      : Promise.resolve([]),
  ]);
  return { sale, items, payments, customer: customerRows[0] ?? null };
}

export async function getSalesSummary(storeId: string, saleIds: string[]) {
  if (!saleIds.length) return [];
  return getDb().select({ saleId: saleItems.saleId, quantity: saleItems.quantity }).from(saleItems).where(inArray(saleItems.saleId, saleIds));
}
