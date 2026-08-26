import "server-only";

import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { customers, exchangeItems, exchanges, productVariants, products, saleItems, sales } from "@/db/schema";

export async function findSalesForExchange(storeId: string, query = "") {
  const filters = [eq(sales.storeId, storeId), eq(sales.status, "confirmed")];
  if (query.trim()) filters.push(or(ilike(sales.number, `%${query.trim()}%`), ilike(customers.name, `%${query.trim()}%`), ilike(customers.phone, `%${query.trim()}%`))!);
  return getDb().select({ id: sales.id, number: sales.number, totalAmount: sales.totalAmount, soldAt: sales.soldAt, customerName: customers.name })
    .from(sales).leftJoin(customers, eq(customers.id, sales.customerId)).where(and(...filters)).orderBy(desc(sales.soldAt)).limit(query.trim() ? 20 : 8);
}

export async function getExchangeContext(storeId: string, saleId: string) {
  const [sale] = await getDb().select({ id: sales.id, number: sales.number, soldAt: sales.soldAt, status: sales.status, customerName: customers.name })
    .from(sales).leftJoin(customers, eq(customers.id, sales.customerId)).where(and(eq(sales.id, saleId), eq(sales.storeId, storeId))).limit(1);
  if (!sale || sale.status !== "confirmed") return null;
  const [soldItems, priorItems, catalog] = await Promise.all([
    getDb().select({ variantId: saleItems.variantId, productName: saleItems.productNameSnapshot, variant: saleItems.variantSnapshot, quantity: saleItems.quantity, unitPrice: saleItems.unitPrice })
      .from(saleItems).where(eq(saleItems.saleId, sale.id)),
    getDb().select({ variantId: exchangeItems.variantId, quantity: exchangeItems.quantity })
      .from(exchangeItems).innerJoin(exchanges, eq(exchanges.id, exchangeItems.exchangeId))
      .where(and(eq(exchanges.saleId, sale.id), eq(exchanges.status, "confirmed"), eq(exchangeItems.direction, "returned"))),
    getDb().select({ variantId: productVariants.id, productName: products.name, color: productVariants.color, size: productVariants.size, stock: productVariants.quantityOnHand, price: sql<string>`coalesce(${productVariants.salePrice}, ${products.salePrice})` })
      .from(productVariants).innerJoin(products, eq(products.id, productVariants.productId))
      .where(and(eq(products.storeId, storeId), eq(products.active, true), eq(productVariants.active, true))).orderBy(products.name, productVariants.color, productVariants.size),
  ]);
  const returned = new Map<string, number>();
  priorItems.forEach((item) => returned.set(item.variantId, (returned.get(item.variantId) ?? 0) + item.quantity));
  const grouped = new Map<string, { variantId: string; productName: string; variant: string; quantity: number; unitPrice: string }>();
  soldItems.forEach((item) => {
    const current = grouped.get(item.variantId);
    if (current) current.quantity += item.quantity;
    else grouped.set(item.variantId, { ...item });
  });
  const returnableItems = [...grouped.values()].map((item) => ({ ...item, availableQuantity: Math.max(0, item.quantity - (returned.get(item.variantId) ?? 0)) })).filter((item) => item.availableQuantity > 0);
  return { sale, returnableItems, catalog };
}

export async function getExchanges(storeId: string, limit = 50) {
  return getDb().select({ id: exchanges.id, saleId: exchanges.saleId, saleNumber: sales.number, reason: exchanges.reason, differenceAmount: exchanges.differenceAmount, outsideDeadline: exchanges.outsideDeadline, status: exchanges.status, exchangedAt: exchanges.exchangedAt, customerName: customers.name })
    .from(exchanges).innerJoin(sales, eq(sales.id, exchanges.saleId)).leftJoin(customers, eq(customers.id, sales.customerId))
    .where(eq(sales.storeId, storeId)).orderBy(desc(exchanges.exchangedAt)).limit(limit);
}

export async function getExchangeDetails(storeId: string, exchangeId: string) {
  const [exchange] = await getDb().select({ id: exchanges.id, saleId: exchanges.saleId, saleNumber: sales.number, soldAt: sales.soldAt, customerName: customers.name, reason: exchanges.reason, outsideDeadline: exchanges.outsideDeadline, differenceAmount: exchanges.differenceAmount, notes: exchanges.notes, exchangedAt: exchanges.exchangedAt, status: exchanges.status })
    .from(exchanges).innerJoin(sales, eq(sales.id, exchanges.saleId)).leftJoin(customers, eq(customers.id, sales.customerId))
    .where(and(eq(exchanges.id, exchangeId), eq(sales.storeId, storeId))).limit(1);
  if (!exchange) return null;
  const items = await getDb().select({ id: exchangeItems.id, direction: exchangeItems.direction, quantity: exchangeItems.quantity, unitPrice: exchangeItems.unitPrice, returnedToStock: exchangeItems.returnedToStock, productName: products.name, color: productVariants.color, size: productVariants.size })
    .from(exchangeItems).innerJoin(productVariants, eq(productVariants.id, exchangeItems.variantId)).innerJoin(products, eq(products.id, productVariants.productId)).where(eq(exchangeItems.exchangeId, exchange.id));
  return { exchange, items };
}
