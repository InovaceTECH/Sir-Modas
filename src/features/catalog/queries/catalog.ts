import "server-only";

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { categories, productTypes, products, productVariants, stockMovements, suppliers } from "@/db/schema";

export async function getCatalogOptions(storeId: string) {
  const db = getDb();
  const [categoryRows, typeRows, supplierRows] = await Promise.all([
    db.select().from(categories).where(and(eq(categories.storeId, storeId), eq(categories.active, true))).orderBy(asc(categories.name)),
    db.select().from(productTypes).where(and(eq(productTypes.storeId, storeId), eq(productTypes.active, true))).orderBy(asc(productTypes.name)),
    db.select().from(suppliers).where(and(eq(suppliers.storeId, storeId), eq(suppliers.active, true))).orderBy(asc(suppliers.name)),
  ]);
  return { categories: categoryRows, productTypes: typeRows, suppliers: supplierRows };
}

export async function getSuppliers(storeId: string) {
  return getDb().select().from(suppliers)
    .where(eq(suppliers.storeId, storeId))
    .orderBy(asc(suppliers.name));
}

export async function getProducts(storeId: string, query = "", status = "all") {
  const filters = [eq(products.storeId, storeId)];
  if (status === "active") filters.push(eq(products.active, true));
  if (status === "inactive") filters.push(eq(products.active, false));
  if (query.trim()) {
    filters.push(or(ilike(products.name, `%${query.trim()}%`), ilike(categories.name, `%${query.trim()}%`), ilike(productTypes.name, `%${query.trim()}%`))!);
  }

  return getDb()
    .select({
      id: products.id,
      name: products.name,
      minimumSalePrice: sql<string>`min(coalesce(${productVariants.salePrice}, ${products.salePrice}))`,
      maximumSalePrice: sql<string>`max(coalesce(${productVariants.salePrice}, ${products.salePrice}))`,
      minimumStock: products.minimumStock,
      active: products.active,
      categoryName: categories.name,
      typeName: productTypes.name,
      variantCount: sql<number>`count(${productVariants.id})::int`,
      totalStock: sql<number>`coalesce(sum(${productVariants.quantityOnHand}), 0)::int`,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(productTypes, eq(productTypes.id, products.productTypeId))
    .leftJoin(productVariants, and(eq(productVariants.productId, products.id), eq(productVariants.active, true)))
    .where(and(...filters))
    .groupBy(products.id, categories.name, productTypes.name)
    .orderBy(desc(products.createdAt));
}

export async function getProduct(storeId: string, productId: string) {
  const [product] = await getDb()
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
    .limit(1);
  if (!product) return null;

  const [variantRows, options] = await Promise.all([
    getDb().select().from(productVariants).where(eq(productVariants.productId, product.id)).orderBy(asc(productVariants.color), asc(productVariants.size)),
    getCatalogOptions(storeId),
  ]);
  return { product, variants: variantRows, options };
}

export async function getStockOverview(storeId: string, query = "", status = "all", selections: { category?: string; color?: string; size?: string } = {}) {
  const filters = [eq(products.storeId, storeId), eq(products.active, true), eq(productVariants.active, true)];
  if (query.trim()) filters.push(or(ilike(products.name, `%${query.trim()}%`), ilike(productVariants.color, `%${query.trim()}%`))!);
  if (status === "out") filters.push(eq(productVariants.quantityOnHand, 0));
  if (status === "low") filters.push(sql`${productVariants.quantityOnHand} > 0 and ${productVariants.quantityOnHand} <= ${products.minimumStock}`);
  if (selections.category) filters.push(eq(categories.name, selections.category));
  if (selections.color) filters.push(eq(productVariants.color, selections.color));
  if (selections.size) filters.push(eq(productVariants.size, selections.size));

  return getDb().select({
    variantId: productVariants.id,
    productId: products.id,
    productName: products.name,
    color: productVariants.color,
    size: productVariants.size,
    quantity: productVariants.quantityOnHand,
    minimumStock: products.minimumStock,
    salePrice: sql<string>`coalesce(${productVariants.salePrice}, ${products.salePrice})`,
    categoryName: categories.name,
  }).from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(and(...filters))
    .orderBy(asc(products.name), asc(productVariants.color), asc(productVariants.size));
}

export async function getRecentStockMovements(storeId: string, limit = 20) {
  return getDb().select({
    id: stockMovements.id,
    productName: products.name,
    color: productVariants.color,
    size: productVariants.size,
    type: stockMovements.type,
    delta: stockMovements.quantityDelta,
    before: stockMovements.quantityBefore,
    after: stockMovements.quantityAfter,
    reason: stockMovements.reason,
    occurredAt: stockMovements.occurredAt,
  }).from(stockMovements)
    .innerJoin(productVariants, eq(productVariants.id, stockMovements.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(stockMovements.storeId, storeId))
    .orderBy(desc(stockMovements.occurredAt))
    .limit(limit);
}
