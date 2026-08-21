import { sql } from "drizzle-orm";
import { date, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { stores } from "./common";

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id").notNull().references(() => stores.id),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    phoneNormalized: text("phone_normalized"),
    birthDate: date("birth_date", { mode: "date" }),
    address: text("address"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("customers_store_name_idx").on(table.storeId, table.name),
    index("customers_store_phone_idx").on(table.storeId, table.phone),
    uniqueIndex("customers_store_phone_normalized_uidx")
      .on(table.storeId, table.phoneNormalized)
      .where(sql`${table.phoneNormalized} is not null`),
  ],
);
