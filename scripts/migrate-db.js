#!/usr/bin/env node
const { config } = require('dotenv');
const { resolve } = require('path');
const { spawn } = require('child_process');

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Validate that we have the DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  console.error('Please add your Supabase database connection string to .env.local:');
  console.error('DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres');
  process.exit(1);
}

console.log('🚀 Running database migration...');
console.log('📍 Using DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@')); // Hide password

const child = spawn('drizzle-kit', ['migrate'], {
  stdio: 'pipe',
  env: { ...process.env }
});

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
  const text = data.toString();
  process.stdout.write(text);
  output += text;
});

child.stderr.on('data', (data) => {
  const text = data.toString();
  process.stderr.write(text);
  errorOutput += text;
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Migration completed successfully!');
  } else {
    console.error('❌ Migration failed with exit code:', code);
    if (errorOutput.includes('ENOTFOUND') || errorOutput.includes('getaddrinfo')) {
      console.error('💡 This looks like a database connection issue.');
      console.error('💡 Please check your DATABASE_URL in .env.local');
    }
    process.exit(1);
  }
});

// Set a timeout to prevent hanging
setTimeout(() => {
  console.error('❌ Command timed out after 30 seconds');
  child.kill('SIGTERM');
  process.exit(1);
}, 30000);
