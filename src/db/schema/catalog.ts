import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { stores } from "./common";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id").notNull().references(() => stores.id),
    name: text("name").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("categories_store_name_uidx").on(table.storeId, table.name)],
);

export const productTypes = pgTable(
  "product_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id").notNull().references(() => stores.id),
    name: text("name").notNull(),
    active: boolean("active").notNull().default(true),
  },
  (table) => [uniqueIndex("product_types_store_name_uidx").on(table.storeId, table.name)],
);

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id").notNull().references(() => stores.id),
    name: text("name").notNull(),
    phone: text("phone"),
    notes: text("notes"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("suppliers_store_idx").on(table.storeId)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id").notNull().references(() => stores.id),
    categoryId: uuid("category_id").references(() => categories.id),
    productTypeId: uuid("product_type_id").references(() => productTypes.id),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    internalCode: text("internal_code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    brand: text("brand"),
    costPrice: numeric("cost_price", { precision: 12, scale: 2 }).notNull(),
    salePrice: numeric("sale_price", { precision: 12, scale: 2 }).notNull(),
    minimumStock: integer("minimum_stock").notNull().default(0),
    photoUrl: text("photo_url"),
    notes: text("notes"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("products_store_code_uidx").on(table.storeId, table.internalCode),
    index("products_store_name_idx").on(table.storeId, table.name),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id),
    color: text("color").notNull(),
    size: text("size").notNull(),
    internalCode: text("internal_code"),
    quantityOnHand: integer("quantity_on_hand").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_variants_product_color_size_uidx").on(
      table.productId,
      table.color,
      table.size,
    ),
    index("product_variants_product_idx").on(table.productId),
    check("product_variants_quantity_nonnegative", sql`${table.quantityOnHand} >= 0`),
  ],
);
