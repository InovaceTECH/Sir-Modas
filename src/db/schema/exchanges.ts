import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { productVariants } from "./catalog";
import { sales } from "./sales";

export const exchangeStatusEnum = pgEnum("exchange_status", ["confirmed", "cancelled"]);
export const exchangeItemDirectionEnum = pgEnum("exchange_item_direction", ["returned", "delivered"]);

export const exchanges = pgTable(
  "exchanges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id").notNull().references(() => sales.id),
    status: exchangeStatusEnum("status").notNull().default("confirmed"),
    reason: text("reason").notNull(),
    outsideDeadline: boolean("outside_deadline").notNull().default(false),
    differenceAmount: numeric("difference_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    exchangedAt: timestamp("exchanged_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("exchanges_sale_idx").on(table.saleId)],
);

export const exchangeItems = pgTable(
  "exchange_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    exchangeId: uuid("exchange_id").notNull().references(() => exchanges.id),
    variantId: uuid("variant_id").notNull().references(() => productVariants.id),
    direction: exchangeItemDirectionEnum("direction").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    returnedToStock: boolean("returned_to_stock").notNull().default(false),
  },
  (table) => [index("exchange_items_exchange_idx").on(table.exchangeId)],
);
