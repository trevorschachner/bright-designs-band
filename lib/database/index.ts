import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { getEnv } from '@/lib/env';

// Optional in the env schema (the Netlify build and CI have none); required
// the moment the database is actually used.
const databaseUrl = getEnv().DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(databaseUrl, {
  prepare: false,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',
  max: 20, // Connection pool limit
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  transform: {
    undefined: null, // Transform undefined to null for postgres compatibility
  },
});

export const db = drizzle(client, { schema }); 