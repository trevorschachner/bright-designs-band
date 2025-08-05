import { defineConfig } from 'drizzle-kit';

const connectionString = "YOUR_ENTIRE_REAL_DIRECT_CONNECTION_STRING_HERE";

export default defineConfig({
  schema: './lib/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
}); 