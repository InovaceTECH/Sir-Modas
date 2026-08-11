import {
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { customers } from "./customers";
import { paymentMethodEnum, sales } from "./sales";

export const receivableStatusEnum = pgEnum("receivable_status", [
  "open",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
]);

export const receivables = pgTable(
  "receivables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull().references(() => customers.id),
    saleId: uuid("sale_id").notNull().references(() => sales.id),
    originalAmount: numeric("original_amount", { precision: 12, scale: 2 }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    remainingAmount: numeric("remaining_amount", { precision: 12, scale: 2 }).notNull(),
    dueDate: date("due_date").notNull(),
    status: receivableStatusEnum("status").notNull().default("open"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("receivables_customer_status_idx").on(table.customerId, table.status),
    index("receivables_due_status_idx").on(table.dueDate, table.status),
  ],
);

export const receivablePayments = pgTable(
  "receivable_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    receivableId: uuid("receivable_id").notNull().references(() => receivables.id),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    method: paymentMethodEnum("method").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    notes: text("notes"),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("receivable_payments_receivable_idx").on(table.receivableId)],
);
