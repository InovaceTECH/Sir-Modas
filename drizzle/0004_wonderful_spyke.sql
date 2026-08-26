ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "sale_price" numeric(12, 2);--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_variants_sale_price_positive'
  ) THEN
    ALTER TABLE "product_variants"
      ADD CONSTRAINT "product_variants_sale_price_positive"
      CHECK ("sale_price" IS NULL OR "sale_price" > 0);
  END IF;
END
$$;
