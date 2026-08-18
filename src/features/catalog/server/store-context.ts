import "server-only";

import { cache } from "react";

import { requireSession } from "@/lib/auth/session";
import { getStoreByOwner } from "@/features/settings/queries/get-store-by-owner";

export const requireStore = cache(async function requireStore() {
  const session = await requireSession();
  const store = await getStoreByOwner(session.user.id);

  return { session, store };
});
