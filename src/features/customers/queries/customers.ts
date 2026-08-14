import "server-only";

import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { customers, exchanges, receivablePayments, receivables, sales } from "@/db/schema";

export async function getCustomerOptions(storeId: string) {
  return getDb().select({ id: customers.id, name: customers.name, phone: customers.phone })
    .from(customers).where(eq(customers.storeId, storeId)).orderBy(asc(customers.name));
}

export async function getCustomers(storeId: string, query = "", status = "all") {
  const filters = [eq(customers.storeId, storeId)];
  if (query.trim()) filters.push(or(ilike(customers.name, `%${query.trim()}%`), ilike(customers.phone, `%${query.trim()}%`))!);
  if (status === "open") filters.push(sql`exists (select 1 from receivables r where r.customer_id = ${customers.id} and r.status <> 'cancelled' and r.remaining_amount > 0)`);
  if (status === "overdue") filters.push(sql`exists (select 1 from receivables r where r.customer_id = ${customers.id} and r.status <> 'cancelled' and r.remaining_amount > 0 and r.due_date < current_date)`);

  return getDb().select({
    id: customers.id,
    name: customers.name,
    phone: customers.phone,
    birthDate: customers.birthDate,
    purchaseTotal: sql<string>`coalesce((select sum(s.total_amount) from sales s where s.customer_id = ${customers.id} and s.status = 'confirmed'), 0)`,
    saleCount: sql<number>`(select count(*)::int from sales s where s.customer_id = ${customers.id} and s.status = 'confirmed')`,
    openBalance: sql<string>`coalesce((select sum(r.remaining_amount) from receivables r where r.customer_id = ${customers.id} and r.status <> 'cancelled'), 0)`,
    overdueCount: sql<number>`(select count(*)::int from receivables r where r.customer_id = ${customers.id} and r.status <> 'cancelled' and r.remaining_amount > 0 and r.due_date < current_date)`,
    lastPurchaseAt: sql<Date | null>`(select max(s.sold_at) from sales s where s.customer_id = ${customers.id} and s.status = 'confirmed')`,
  }).from(customers).where(and(...filters)).orderBy(asc(customers.name)).limit(100);
}

export async function getCustomerDetails(storeId: string, customerId: string) {
  const [customer] = await getDb().select().from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.storeId, storeId))).limit(1);
  if (!customer) return null;

  const [customerSales, customerReceivables, customerExchanges] = await Promise.all([
    getDb().select({ id: sales.id, number: sales.number, totalAmount: sales.totalAmount, status: sales.status, source: sales.source, soldAt: sales.soldAt })
      .from(sales).where(eq(sales.customerId, customer.id)).orderBy(desc(sales.soldAt)).limit(50),
    getDb().select({ id: receivables.id, saleId: receivables.saleId, saleNumber: sales.number, originalAmount: receivables.originalAmount, paidAmount: receivables.paidAmount, remainingAmount: receivables.remainingAmount, dueDate: receivables.dueDate, status: receivables.status, notes: receivables.notes, createdAt: receivables.createdAt })
      .from(receivables).innerJoin(sales, eq(sales.id, receivables.saleId))
      .where(eq(receivables.customerId, customer.id)).orderBy(desc(receivables.createdAt)),
    getDb().select({ id: exchanges.id, saleNumber: sales.number, reason: exchanges.reason, differenceAmount: exchanges.differenceAmount, outsideDeadline: exchanges.outsideDeadline, exchangedAt: exchanges.exchangedAt })
      .from(exchanges).innerJoin(sales, eq(sales.id, exchanges.saleId)).where(eq(sales.customerId, customer.id)).orderBy(desc(exchanges.exchangedAt)),
  ]);
  const receivableIds = customerReceivables.map((item) => item.id);
  const payments = receivableIds.length ? await getDb().select().from(receivablePayments)
    .where(inArray(receivablePayments.receivableId, receivableIds)).orderBy(desc(receivablePayments.paidAt)) : [];

  return { customer, sales: customerSales, receivables: customerReceivables, payments, exchanges: customerExchanges };
}

export async function getReceivablesSummary(storeId: string) {
  const [summary] = await getDb().select({
    openAmount: sql<string>`coalesce(sum(${receivables.remainingAmount}) filter (where ${receivables.status} <> 'cancelled'), 0)`,
    overdueAmount: sql<string>`coalesce(sum(${receivables.remainingAmount}) filter (where ${receivables.status} <> 'cancelled' and ${receivables.remainingAmount} > 0 and ${receivables.dueDate} < current_date), 0)`,
    overdueCount: sql<number>`count(*) filter (where ${receivables.status} <> 'cancelled' and ${receivables.remainingAmount} > 0 and ${receivables.dueDate} < current_date)::int`,
  }).from(receivables).innerJoin(customers, eq(customers.id, receivables.customerId)).where(eq(customers.storeId, storeId));
  return summary ?? { openAmount: "0", overdueAmount: "0", overdueCount: 0 };
}
