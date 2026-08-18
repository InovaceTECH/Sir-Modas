import "server-only";

import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { cashMovements, cashSessions, categories, customers, productVariants, products, receivablePayments, receivables, saleItems, salePayments, sales, stockMovements } from "@/db/schema";

export type ReportType = "sales" | "inventory" | "cash" | "receivables";
const saoPauloToday = sql`(now() at time zone 'America/Sao_Paulo')::date`;

export function getDefaultReportRange() {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" });
  const today = formatter.format(new Date());
  return { from: `${today.slice(0, 7)}-01`, to: today };
}

export function normalizeReportRange(from?: string, to?: string) {
  const defaults = getDefaultReportRange();
  const valid = (value?: string) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
  const normalized = { from: valid(from) ? from! : defaults.from, to: valid(to) ? to! : defaults.to };
  return normalized.from <= normalized.to ? normalized : { from: normalized.to, to: normalized.from };
}

function boundaries(from: string, to: string) {
  const start = new Date(`${from}T00:00:00-03:00`);
  const end = new Date(`${to}T00:00:00-03:00`);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function getReportsData(storeId: string, from: string, to: string) {
  const { start, end } = boundaries(from, to);
  const salePeriod = and(eq(sales.storeId, storeId), eq(sales.status, "confirmed"), gte(sales.soldAt, start), lt(sales.soldAt, end));
  const cashPeriod = and(eq(cashSessions.storeId, storeId), gte(cashMovements.occurredAt, start), lt(cashMovements.occurredAt, end));

  const [saleSummaryRows, pieceSummaryRows, productsSold, salesBySource, salesByPayment, inventorySummaryRows, inventoryProducts, inventoryMovements, cashSummaryRows, cashByPayment, closedCashRows, receivableSummaryRows, receivedSummaryRows, customerBalances, recentReceivablePayments] = await Promise.all([
    getDb().select({ revenue: sql<string>`coalesce(sum(${sales.totalAmount}), 0)`, saleCount: sql<number>`count(*)::int`, ticketAverage: sql<string>`coalesce(avg(${sales.totalAmount}), 0)` }).from(sales).where(salePeriod),
    getDb().select({ pieces: sql<number>`coalesce(sum(${saleItems.quantity}), 0)::int` }).from(saleItems).innerJoin(sales, eq(sales.id, saleItems.saleId)).where(salePeriod),
    getDb().select({ name: saleItems.productNameSnapshot, pieces: sql<number>`sum(${saleItems.quantity})::int`, revenue: sql<string>`coalesce(sum(${saleItems.totalAmount} * ${sales.totalAmount} / nullif(${sales.subtotal}, 0)), 0)` }).from(saleItems).innerJoin(sales, eq(sales.id, saleItems.saleId)).where(salePeriod).groupBy(saleItems.productNameSnapshot).orderBy(desc(sql`sum(${saleItems.quantity})`)).limit(10),
    getDb().select({ label: sales.source, value: sql<string>`sum(${sales.totalAmount})`, count: sql<number>`count(*)::int` }).from(sales).where(salePeriod).groupBy(sales.source).orderBy(desc(sql`sum(${sales.totalAmount})`)),
    getDb().select({ label: salePayments.method, value: sql<string>`sum(${salePayments.amount})` }).from(salePayments).innerJoin(sales, eq(sales.id, salePayments.saleId)).where(salePeriod).groupBy(salePayments.method).orderBy(desc(sql`sum(${salePayments.amount})`)),
    getDb().select({ units: sql<number>`coalesce(sum(${productVariants.quantityOnHand}), 0)::int`, lowCount: sql<number>`count(*) filter (where ${productVariants.quantityOnHand} > 0 and ${productVariants.quantityOnHand} <= ${products.minimumStock})::int`, outCount: sql<number>`count(*) filter (where ${productVariants.quantityOnHand} = 0)::int`, costValue: sql<string>`coalesce(sum(${productVariants.quantityOnHand} * ${products.costPrice}), 0)` }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).where(and(eq(products.storeId, storeId), eq(products.active, true), eq(productVariants.active, true))),
    getDb().select({ name: products.name, category: categories.name, units: sql<number>`sum(${productVariants.quantityOnHand})::int`, minimum: products.minimumStock }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).leftJoin(categories, eq(categories.id, products.categoryId)).where(and(eq(products.storeId, storeId), eq(products.active, true), eq(productVariants.active, true))).groupBy(products.id, categories.name).orderBy(asc(sql`sum(${productVariants.quantityOnHand})`)).limit(20),
    getDb().select({ type: stockMovements.type, quantity: sql<number>`sum(abs(${stockMovements.quantityDelta}))::int` }).from(stockMovements).where(and(eq(stockMovements.storeId, storeId), gte(stockMovements.occurredAt, start), lt(stockMovements.occurredAt, end))).groupBy(stockMovements.type),
    getDb().select({ received: sql<string>`coalesce(sum(case when ${cashMovements.type} = 'cancellation' then -${cashMovements.amount} else ${cashMovements.amount} end) filter (where ${cashMovements.type} in ('sale','receivable_payment','cash_injection','adjustment','cancellation')), 0)`, withdrawals: sql<string>`coalesce(sum(${cashMovements.amount}) filter (where ${cashMovements.type} = 'withdrawal'), 0)`, expenses: sql<string>`coalesce(sum(${cashMovements.amount}) filter (where ${cashMovements.type} = 'expense'), 0)` }).from(cashMovements).innerJoin(cashSessions, eq(cashSessions.id, cashMovements.cashSessionId)).where(cashPeriod),
    getDb().select({ label: cashMovements.paymentMethod, value: sql<string>`sum(case when ${cashMovements.type} = 'cancellation' then -${cashMovements.amount} else ${cashMovements.amount} end)` }).from(cashMovements).innerJoin(cashSessions, eq(cashSessions.id, cashMovements.cashSessionId)).where(and(cashPeriod, sql`${cashMovements.paymentMethod} is not null`, sql`${cashMovements.type} in ('sale','receivable_payment','adjustment','cancellation')`)).groupBy(cashMovements.paymentMethod).orderBy(desc(sql`sum(case when ${cashMovements.type} = 'cancellation' then -${cashMovements.amount} else ${cashMovements.amount} end)`)),
    getDb().select({ count: sql<number>`count(*)::int`, difference: sql<string>`coalesce(sum(${cashSessions.differenceAmount}), 0)` }).from(cashSessions).where(and(eq(cashSessions.storeId, storeId), eq(cashSessions.status, "closed"), gte(cashSessions.closedAt, start), lt(cashSessions.closedAt, end))),
    getDb().select({ openAmount: sql<string>`coalesce(sum(${receivables.remainingAmount}) filter (where ${receivables.status} <> 'cancelled'), 0)`, overdueAmount: sql<string>`coalesce(sum(${receivables.remainingAmount}) filter (where ${receivables.status} <> 'cancelled' and ${receivables.remainingAmount} > 0 and ${receivables.dueDate} < ${saoPauloToday}), 0)`, overdueCount: sql<number>`count(*) filter (where ${receivables.status} <> 'cancelled' and ${receivables.remainingAmount} > 0 and ${receivables.dueDate} < ${saoPauloToday})::int` }).from(receivables).innerJoin(customers, eq(customers.id, receivables.customerId)).where(eq(customers.storeId, storeId)),
    getDb().select({ received: sql<string>`coalesce(sum(${receivablePayments.amount}), 0)`, count: sql<number>`count(*)::int` }).from(receivablePayments).innerJoin(receivables, eq(receivables.id, receivablePayments.receivableId)).innerJoin(customers, eq(customers.id, receivables.customerId)).where(and(eq(customers.storeId, storeId), gte(receivablePayments.paidAt, start), lt(receivablePayments.paidAt, end))),
    getDb().select({ id: customers.id, name: customers.name, phone: customers.phone, balance: sql<string>`sum(${receivables.remainingAmount})` }).from(customers).innerJoin(receivables, eq(receivables.customerId, customers.id)).where(and(eq(customers.storeId, storeId), sql`${receivables.status} <> 'cancelled'`, sql`${receivables.remainingAmount} > 0`)).groupBy(customers.id).orderBy(desc(sql`sum(${receivables.remainingAmount})`)).limit(10),
    getDb().select({ customerName: customers.name, amount: receivablePayments.amount, method: receivablePayments.method, paidAt: receivablePayments.paidAt }).from(receivablePayments).innerJoin(receivables, eq(receivables.id, receivablePayments.receivableId)).innerJoin(customers, eq(customers.id, receivables.customerId)).where(and(eq(customers.storeId, storeId), gte(receivablePayments.paidAt, start), lt(receivablePayments.paidAt, end))).orderBy(desc(receivablePayments.paidAt)).limit(20),
  ]);

  return {
    range: { from, to },
    sales: { summary: { ...(saleSummaryRows[0] ?? { revenue: "0", saleCount: 0, ticketAverage: "0" }), pieces: pieceSummaryRows[0]?.pieces ?? 0 }, products: productsSold, bySource: salesBySource, byPayment: salesByPayment },
    inventory: { summary: inventorySummaryRows[0] ?? { units: 0, lowCount: 0, outCount: 0, costValue: "0" }, products: inventoryProducts, movements: inventoryMovements },
    cash: { summary: cashSummaryRows[0] ?? { received: "0", withdrawals: "0", expenses: "0" }, byPayment: cashByPayment, closed: closedCashRows[0] ?? { count: 0, difference: "0" } },
    receivables: { summary: receivableSummaryRows[0] ?? { openAmount: "0", overdueAmount: "0", overdueCount: 0 }, received: receivedSummaryRows[0] ?? { received: "0", count: 0 }, customers: customerBalances, payments: recentReceivablePayments },
  };
}

export async function getReportExportData(storeId: string, from: string, to: string) {
  const { start, end } = boundaries(from, to);
  const salePeriod = and(eq(sales.storeId, storeId), eq(sales.status, "confirmed"), gte(sales.soldAt, start), lt(sales.soldAt, end));
  const cashPeriod = and(eq(cashSessions.storeId, storeId), gte(cashMovements.occurredAt, start), lt(cashMovements.occurredAt, end));

  const [salesProducts, inventoryProducts, cashPayments, customerBalances] = await Promise.all([
    getDb().select({ name: saleItems.productNameSnapshot, pieces: sql<number>`sum(${saleItems.quantity})::int`, revenue: sql<string>`coalesce(sum(${saleItems.totalAmount} * ${sales.totalAmount} / nullif(${sales.subtotal}, 0)), 0)` })
      .from(saleItems).innerJoin(sales, eq(sales.id, saleItems.saleId)).where(salePeriod).groupBy(saleItems.productNameSnapshot).orderBy(desc(sql`sum(${saleItems.quantity})`)),
    getDb().select({ name: products.name, category: categories.name, units: sql<number>`sum(${productVariants.quantityOnHand})::int`, minimum: products.minimumStock })
      .from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).leftJoin(categories, eq(categories.id, products.categoryId))
      .where(and(eq(products.storeId, storeId), eq(products.active, true), eq(productVariants.active, true))).groupBy(products.id, categories.name).orderBy(asc(sql`sum(${productVariants.quantityOnHand})`)),
    getDb().select({ label: cashMovements.paymentMethod, value: sql<string>`sum(case when ${cashMovements.type} = 'cancellation' then -${cashMovements.amount} else ${cashMovements.amount} end)` })
      .from(cashMovements).innerJoin(cashSessions, eq(cashSessions.id, cashMovements.cashSessionId))
      .where(and(cashPeriod, sql`${cashMovements.paymentMethod} is not null`, sql`${cashMovements.type} in ('sale','receivable_payment','adjustment','cancellation')`)).groupBy(cashMovements.paymentMethod).orderBy(desc(sql`sum(case when ${cashMovements.type} = 'cancellation' then -${cashMovements.amount} else ${cashMovements.amount} end)`)),
    getDb().select({ id: customers.id, name: customers.name, phone: customers.phone, balance: sql<string>`sum(${receivables.remainingAmount})` })
      .from(customers).innerJoin(receivables, eq(receivables.customerId, customers.id)).where(and(eq(customers.storeId, storeId), sql`${receivables.status} <> 'cancelled'`, sql`${receivables.remainingAmount} > 0`)).groupBy(customers.id).orderBy(desc(sql`sum(${receivables.remainingAmount})`)),
  ]);

  return { salesProducts, inventoryProducts, cashPayments, customerBalances };
}
