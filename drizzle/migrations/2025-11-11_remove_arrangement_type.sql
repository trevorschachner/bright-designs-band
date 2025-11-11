-- Drop legacy 'type' column from arrangements; scene is used instead
ALTER TABLE "arrangements" DROP COLUMN IF EXISTS "type";


