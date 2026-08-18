"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db";
import { suppliers } from "@/db/schema";

import { requireStore } from "../server/store-context";

const supplierSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30),
  notes: z.string().trim().max(1000),
});

export async function createSupplier(formData: FormData) {
  const { store } = await requireStore();
  if (!store) return;
  const parsed = supplierSchema.safeParse({ name: formData.get("name"), phone: formData.get("phone"), notes: formData.get("notes") });
  if (!parsed.success) return;

  const existing = await getDb().select({ id: suppliers.id }).from(suppliers)
    .where(and(eq(suppliers.storeId, store.id), sql`lower(${suppliers.name}) = lower(${parsed.data.name})`)).limit(1);
  if (existing.length) return;
  await getDb().insert(suppliers).values({
    storeId: store.id,
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
  });
  revalidatePath("/produtos/fornecedores");
  revalidatePath("/produtos/novo");
}

export async function toggleSupplierStatus(formData: FormData) {
  const { store } = await requireStore();
  if (!store) return;
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const active = formData.get("active") === "true";
  await getDb().update(suppliers).set({ active: !active })
    .where(and(eq(suppliers.id, id.data), eq(suppliers.storeId, store.id)));
  revalidatePath("/produtos/fornecedores");
  revalidatePath("/produtos/novo");
}
