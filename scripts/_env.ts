/**
 * Loads .env.local into process.env. Side-effect module: scripts/_common.ts
 * imports it first, so the env is set before any lib/ module reads it (lib/storage
 * reads the bucket and root prefix when it is first imported).
 *
 * Existing process.env values win (dotenv never overrides), so
 * `DATABASE_URL= npx tsx scripts/x.ts` runs a script with no database.
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local'), quiet: true })
