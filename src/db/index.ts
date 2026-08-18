import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseEnv } from "@/lib/env";

import * as schema from "./schema";

function createDatabase() {
  const { DATABASE_URL } = getDatabaseEnv();
  const client = postgres(DATABASE_URL, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
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
