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
  uuid,
} from "drizzle-orm/pg-core";

import { productVariants, suppliers } from "./catalog";
import { stores } from "./common";

export const stockEntryStatusEnum = pgEnum("stock_entry_status", ["draft", "confirmed", "cancelled"]);
export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "initial",
  "entry",
  "sale",
  "sale_cancellation",
  "exchange_in",
  "exchange_out",
  "adjustment_in",
  "adjustment_out",
  "damaged",
]);

export const stockEntries = pgTable(
  "stock_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id").notNull().references(() => stores.id),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    status: stockEntryStatusEnum("status").notNull().default("draft"),
    documentNumber: text("document_number"),
    notes: text("notes"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  },
  (table) => [index("stock_entries_store_date_idx").on(table.storeId, table.receivedAt)],
);

export const stockEntryItems = pgTable(
  "stock_entry_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stockEntryId: uuid("stock_entry_id").notNull().references(() => stockEntries.id),
    variantId: uuid("variant_id").notNull().references(() => productVariants.id),
    quantity: integer("quantity").notNull(),
    unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull(),
    salePrice: numeric("sale_price", { precision: 12, scale: 2 }),
  },
  (table) => [
    index("stock_entry_items_entry_idx").on(table.stockEntryId),
    check("stock_entry_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id").notNull().references(() => stores.id),
    variantId: uuid("variant_id").notNull().references(() => productVariants.id),
    type: stockMovementTypeEnum("type").notNull(),
    quantityDelta: integer("quantity_delta").notNull(),
    quantityBefore: integer("quantity_before").notNull(),
    quantityAfter: integer("quantity_after").notNull(),
    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),
    reason: text("reason"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("stock_movements_variant_date_idx").on(table.variantId, table.occurredAt),
    index("stock_movements_store_date_idx").on(table.storeId, table.occurredAt),
    check("stock_movements_delta_nonzero", sql`${table.quantityDelta} <> 0`),
    check("stock_movements_after_nonnegative", sql`${table.quantityAfter} >= 0`),
  ],
);
