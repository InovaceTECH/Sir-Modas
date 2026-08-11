import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { getServerEnv } from "@/lib/env";

import * as schema from "./schema";

export function getDb() {
  const { DATABASE_URL } = getServerEnv();
  const sql = neon(DATABASE_URL);

  return drizzle({ client: sql, schema });
}

export type Database = ReturnType<typeof getDb>;
