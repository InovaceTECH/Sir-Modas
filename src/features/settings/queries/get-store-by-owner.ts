import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { stores } from "@/db/schema";

export async function getStoreByOwner(ownerAuthId: string) {
  const [store] = await getDb()
    .select()
    .from(stores)
    .where(eq(stores.ownerAuthId, ownerAuthId))
    .limit(1);

  return store ?? null;
}
