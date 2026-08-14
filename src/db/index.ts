import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseEnv } from "@/lib/env";

import * as schema from "./schema";

function createDatabase() {
  const { DATABASE_URL } = getDatabaseEnv();
  const client = postgres(DATABASE_URL, {
    max: process.env.NODE_ENV === "development" ? 5 : 1,
    prepare: false,
  });

  return drizzle({ client, schema });
}

export type Database = ReturnType<typeof createDatabase>;

const globalDatabase = globalThis as typeof globalThis & {
  sirModasDatabase?: Database;
};

export function getDb() {
  globalDatabase.sirModasDatabase ??= createDatabase();
  return globalDatabase.sirModasDatabase;
}
