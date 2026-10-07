import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { getEnv } from '@/lib/env.server';

export type Database = PostgresJsDatabase<typeof schema>;

/**
 * The database is created lazily, on the first property access of `db`.
 *
 * Importing this module never connects and never throws, so the build, CI and
 * tests can import anything that imports it without a DATABASE_URL. The first
 * query without one throws a clear error instead.
 *
 * `db` is a Proxy over the real Drizzle instance rather than a `getDb()`
 * function so that every existing `import { db }` call site keeps working
 * unchanged. Methods are bound to the real instance, so `db.select()`,
 * `db.query.shows.findMany()` and `db.transaction()` behave exactly as before.
 */

export const DATABASE_URL_MISSING =
  'DATABASE_URL is not set. The database was used (a query ran) in an environment ' +
  'without a connection string; set DATABASE_URL to a postgres:// URL.';

/** True when a connection string is configured. Never connects. */
export function isDatabaseConfigured(): boolean {
  return Boolean(getEnv().DATABASE_URL);
}

// Kept on globalThis so dev-mode module reloads reuse one pool instead of
// leaking a new one per reload.
const holder = globalThis as unknown as { __bdbDatabase?: Database };

export function getDb(): Database {
  if (holder.__bdbDatabase) return holder.__bdbDatabase;

  const databaseUrl = getEnv().DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(DATABASE_URL_MISSING);
  }

  // Disable prefetch as it is not supported for "Transaction" pool mode
  const client = postgres(databaseUrl, {
    prepare: false,
    ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',
    // Each serverless function instance holds its own pool, and the Supabase
    // pooler is shared by all of them: keep the per-instance pool small.
    max: 5,
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout in seconds
    transform: {
      undefined: null, // Transform undefined to null for postgres compatibility
    },
  });

  holder.__bdbDatabase = drizzle(client, { schema });
  return holder.__bdbDatabase;
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === 'function' ? value.bind(real) : value;
  },
  has(_target, prop) {
    return Reflect.has(getDb(), prop);
  },
});
