import "server-only";

import { eq } from "drizzle-orm";
import { cache } from "react";

import { getDb } from "@/db";
import { stores } from "@/db/schema";

export const getStoreByOwner = cache(async function getStoreByOwner(ownerAuthId: string) {
  const db = getDb();
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.ownerAuthId, ownerAuthId))
    .limit(1);

  if (store) return store;

  const [created] = await db
    .insert(stores)
    .values({ ownerAuthId, name: "Sir Modas Store" })
    .onConflictDoNothing({ target: stores.ownerAuthId })
    .returning();

  if (created) return created;

  // Outra requisição pode ter criado a loja entre a consulta e o insert.
  const [existing] = await db
    .select()
    .from(stores)
    .where(eq(stores.ownerAuthId, ownerAuthId))
    .limit(1);

  return existing ?? null;
});
