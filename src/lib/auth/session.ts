import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { user } from "@/db/schema";
import { getSetupStatus } from "@/lib/env";

import { isLocalAuthBypassEnabled } from "./local-bypass";

async function getLocalDevelopmentSession(requestHeaders: Headers) {
  const hostname = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? undefined;

  if (!isLocalAuthBypassEnabled(hostname)) return null;

  const [owner] = await getDb()
    .select()
    .from(user)
    .where(eq(user.email, "sirmodas@gmail.com"))
    .limit(1);

  if (!owner) return null;

  const now = new Date();

  return {
    user: owner,
    session: {
      id: "local-development-session",
      token: "local-development-session",
      userId: owner.id,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      ipAddress: null,
      userAgent: "Local development bypass",
    },
  };
}

export async function getCurrentSession() {
  if (!getSetupStatus().ready) {
    return null;
  }

  const requestHeaders = await headers();
  const localSession = await getLocalDevelopmentSession(requestHeaders);

  if (localSession) return localSession;

  const { auth } = await import("./server");
  return auth.api.getSession({ headers: requestHeaders });
}

export async function requireSession() {
  if (!getSetupStatus().ready) {
    redirect("/setup");
  }

  const session = await getCurrentSession();

  if (!session) {
    redirect("/entrar");
  }

  return session;
}
