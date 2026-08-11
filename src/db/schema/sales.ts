import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { cashSessions } from "./cash";
import { productVariants } from "./catalog";
import { stores } from "./common";
import { customers } from "./customers";

export const saleStatusEnum = pgEnum("sale_status", ["confirmed", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "pix",
  "debit_card",
  "credit_card",
  "on_account",
]);

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id").notNull().references(() => stores.id),
    cashSessionId: uuid("cash_session_id").notNull().references(() => cashSessions.id),
    customerId: uuid("customer_id").references(() => customers.id),
    number: text("number").notNull(),
    status: saleStatusEnum("status").notNull().default("confirmed"),
    source: text("source").notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    notes: text("notes"),
    soldAt: timestamp("sold_at", { withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
  },
  (table) => [
    uniqueIndex("sales_store_number_uidx").on(table.storeId, table.number),
    index("sales_store_date_idx").on(table.storeId, table.soldAt),
  ],
);

export const saleItems = pgTable(
  "sale_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id").notNull().references(() => sales.id),
    variantId: uuid("variant_id").notNull().references(() => productVariants.id),
    productNameSnapshot: text("product_name_snapshot").notNull(),
    variantSnapshot: text("variant_snapshot").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [
    index("sale_items_sale_idx").on(table.saleId),
    check("sale_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const salePayments = pgTable(
  "sale_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id").notNull().references(() => sales.id),
    method: paymentMethodEnum("method").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    installments: integer("installments"),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sale_payments_sale_idx").on(table.saleId)],
);
