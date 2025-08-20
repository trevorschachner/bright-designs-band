import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',
  },
  verbose: process.env.NODE_ENV === 'development',
  strict: true, // Enable strict mode for safer migrations
});