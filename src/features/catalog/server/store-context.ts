import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { stores } from "@/db/schema";
import { requireSession } from "@/lib/auth/session";

export async function requireStore() {
  const session = await requireSession();
  const [store] = await getDb()
    .select()
    .from(stores)
    .where(eq(stores.ownerAuthId, session.user.id))
    .limit(1);

  return { session, store: store ?? null };
}
