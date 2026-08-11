import { sql } from "drizzle-orm";
import {
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { stores } from "./common";

export const cashSessionStatusEnum = pgEnum("cash_session_status", ["open", "closed"]);
export const cashMovementTypeEnum = pgEnum("cash_movement_type", [
  "sale",
  "receivable_payment",
  "withdrawal",
  "cash_injection",
  "expense",
  "cancellation",
  "adjustment",
]);

export const cashSessions = pgTable(
  "cash_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id").notNull().references(() => stores.id),
    status: cashSessionStatusEnum("status").notNull().default("open"),
    openingAmount: numeric("opening_amount", { precision: 12, scale: 2 }).notNull(),
    countedAmount: numeric("counted_amount", { precision: 12, scale: 2 }),
    expectedCashAmount: numeric("expected_cash_amount", { precision: 12, scale: 2 }),
    differenceAmount: numeric("difference_amount", { precision: 12, scale: 2 }),
    openingNotes: text("opening_notes"),
    closingNotes: text("closing_notes"),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    index("cash_sessions_store_status_idx").on(table.storeId, table.status),
    uniqueIndex("cash_sessions_one_open_per_store_uidx")
      .on(table.storeId)
      .where(sql`${table.status} = 'open'`),
  ],
);

export const cashMovements = pgTable(
  "cash_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cashSessionId: uuid("cash_session_id").notNull().references(() => cashSessions.id),
    type: cashMovementTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: text("payment_method"),
    reason: text("reason").notNull(),
    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),
    notes: text("notes"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("cash_movements_session_date_idx").on(table.cashSessionId, table.occurredAt)],
);
