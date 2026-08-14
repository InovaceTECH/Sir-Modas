import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerAuthId: text("owner_auth_id")
    .notNull()
    .unique()
    .references(() => user.id),
  phone: text("phone"),
  address: text("address"),
  exchangeDeadlineDays: integer("exchange_deadline_days").notNull().default(30),
  allowNegativeStock: boolean("allow_negative_stock").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
