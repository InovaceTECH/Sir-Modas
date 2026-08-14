import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const migrationDatabaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!migrationDatabaseUrl) {
  throw new Error("DATABASE_URL não foi definida.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: migrationDatabaseUrl,
  },
  strict: true,
  verbose: true,
});
