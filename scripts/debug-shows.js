#!/usr/bin/env node
const { config } = require('dotenv');
const { resolve } = require('path');
const { createClient } = require('@supabase/supabase-js');

config({ path: resolve(process.cwd(), '.env.local') });

const sanitizeValue = (value) => {
  if (!value || value === '****') return null;
  return value.trim();
};

const url = sanitizeValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const key = sanitizeValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function main() {
  const supabase = createClient(url, key);
  const { data, error, count } = await supabase
    .from('shows')
    .select('id,slug,title', { count: 'exact', head: false })
    .order('id', { ascending: true });
  if (error) {
    console.error('Supabase error:', error.message);
    process.exit(1);
  }
  console.log('Shows count:', count ?? (Array.isArray(data) ? data.length : 0));
  console.log('First rows:', (data || []).slice(0, 10));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


