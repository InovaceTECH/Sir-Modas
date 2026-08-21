ALTER TABLE "customers" ADD COLUMN "phone_normalized" text;--> statement-breakpoint
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
  AND ranked_customers.position = 1;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_store_phone_normalized_uidx"
  ON "customers" USING btree ("store_id", "phone_normalized")
  WHERE "customers"."phone_normalized" IS NOT NULL;
