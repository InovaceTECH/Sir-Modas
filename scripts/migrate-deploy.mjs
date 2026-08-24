import postgres from "postgres";

if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
  console.log(`Migrations ignoradas no ambiente Vercel ${process.env.VERCEL_ENV}.`);
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_UNPOOLED ou DATABASE_URL não foi definida para o deploy.");

const client = postgres(databaseUrl, { max: 1, prepare: false });

try {
  await client.begin(async (tx) => {
    await tx.unsafe('ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "phone_normalized" text');
    await tx.unsafe('UPDATE "customers" SET "phone_normalized" = NULL');
    await tx.unsafe(`
      WITH ranked_customers AS (
        SELECT
          "id",
          regexp_replace("phone", '[^0-9]', '', 'g') AS normalized_phone,
          row_number() OVER (
            PARTITION BY "store_id", regexp_replace("phone", '[^0-9]', '', 'g')
            ORDER BY "created_at", "id"
          ) AS position
        FROM "customers"
      )
      UPDATE "customers" AS customer
      SET "phone_normalized" = ranked_customers.normalized_phone
      FROM ranked_customers
      WHERE customer."id" = ranked_customers."id"
        AND ranked_customers.position = 1
    `);
    await tx.unsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "customers_store_phone_normalized_uidx"
      ON "customers" USING btree ("store_id", "phone_normalized")
      WHERE "customers"."phone_normalized" IS NOT NULL
    `);
    await tx.unsafe('ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone');
  });
  console.log("Schema de produção atualizado com sucesso.");
} finally {
  await client.end();
}
