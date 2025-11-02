-- Drop unused columns from arrangements
ALTER TABLE "public"."arrangements" DROP COLUMN IF EXISTS name;
ALTER TABLE "public"."arrangements" DROP COLUMN IF EXISTS price;


