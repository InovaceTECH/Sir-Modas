import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { products, productVariants, saleItems, sales } from "@/db/schema";
import { getReceivablesSummary } from "@/features/customers/queries/customers";

export async function getDashboardData(storeId: string, period: "today" | "week" | "month" = "today") {
  const unit = period === "month" ? "month" : period === "week" ? "week" : "day";
  const periodFilter = sql`${sales.soldAt} >= date_trunc(${unit}, now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'`;
  const [saleSummary, stockSummary, recentSales, receivables] = await Promise.all([
    getDb().select({
      revenue: sql<string>`coalesce(sum(${sales.totalAmount}), 0)`,
      saleCount: sql<number>`count(${sales.id})::int`,
    }).from(sales).where(and(eq(sales.storeId, storeId), eq(sales.status, "confirmed"), periodFilter)),
    getDb().select({
      lowCount: sql<number>`count(*) filter (where ${productVariants.quantityOnHand} > 0 and ${productVariants.quantityOnHand} <= ${products.minimumStock})::int`,
      outCount: sql<number>`count(*) filter (where ${productVariants.quantityOnHand} = 0)::int`,
    }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).where(and(eq(products.storeId, storeId), eq(products.active, true), eq(productVariants.active, true))),
    getDb().select({ id: sales.id, number: sales.number, total: sales.totalAmount, source: sales.source, soldAt: sales.soldAt }).from(sales).where(and(eq(sales.storeId, storeId), eq(sales.status, "confirmed"))).orderBy(desc(sales.soldAt)).limit(5),
    getReceivablesSummary(storeId),
  ]);
  const recentIds = recentSales.map((sale) => sale.id);
  const pieces = recentIds.length ? await getDb().select({ saleId: saleItems.saleId, quantity: sql<number>`sum(${saleItems.quantity})::int` }).from(saleItems).where(inArray(saleItems.saleId, recentIds)).groupBy(saleItems.saleId) : [];
  return { sales: saleSummary[0] ?? { revenue: "0", saleCount: 0 }, stock: stockSummary[0] ?? { lowCount: 0, outCount: 0 }, receivables, recentSales, pieceCount: new Map(pieces.map((item) => [item.saleId, item.quantity])) };
}
