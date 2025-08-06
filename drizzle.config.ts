import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://postgres.yibokqolsyxosftcupgz:Nk1Umt0HjjwHn6gD@aws-0-us-east-2.pooler.supabase.com:6543/postgres"
  },
});