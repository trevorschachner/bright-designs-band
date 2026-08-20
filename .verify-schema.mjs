import pg from 'pg'; import dotenv from 'dotenv'; import { readFile } from 'fs/promises'
dotenv.config({ path: '.env.local' })
const APPLY = process.argv.includes('--apply')
const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect()
const sql = (await readFile('drizzle/migrations/2026-08-19_schema_truth.sql','utf8'))
  .replace(/^\s*begin;\s*$/mi,'').replace(/^\s*commit;\s*$/mi,'')

const pre = await c.query(`select count(*) n from arrangements where "percussion arranger" is not null`)
const dupes = await c.query(`select count(*) n from (select slug from shows group by slug having count(*)>1) d`)
console.log(`precondition: spaced column non-null rows = ${pre.rows[0].n} (must be 0)`)
console.log(`precondition: duplicate slugs = ${dupes.rows[0].n} (must be 0)`)
if (pre.rows[0].n !== '0' || dupes.rows[0].n !== '0') { console.log('ABORT: preconditions not met'); process.exit(1) }

await c.query('begin')
await c.query(sql)

const col = await c.query(`select count(*) n from information_schema.columns where table_name='arrangements' and column_name='percussion arranger'`)
const real = await c.query(`select count(percussion_arranger) n from arrangements`)
const idx = await c.query(`select indexname, indexdef from pg_indexes where tablename='shows' and indexdef ilike '%slug%'`)
const checks = [
  { check: 'spaced column removed', pass: col.rows[0].n === '0' },
  { check: 'percussion_arranger data intact (68)', pass: real.rows[0].n === '68' },
  { check: 'slug index is UNIQUE', pass: idx.rows.some(r => /UNIQUE/i.test(r.indexdef)) },
]
// a duplicate slug must now be rejected — proves the constraint is live
await c.query('savepoint sp')
try {
  await c.query(`insert into shows (title, slug, featured, display_order) select 'dupe', slug, false, 0 from shows limit 1`)
  checks.push({ check: 'duplicate slug rejected', pass: false })
} catch { checks.push({ check: 'duplicate slug rejected', pass: true }) }
await c.query('rollback to savepoint sp')

console.table(checks)
console.log('slug indexes:', idx.rows.map(r=>r.indexname).join(', '))
const failed = checks.filter(c=>!c.pass)
if (APPLY && !failed.length) { await c.query('commit'); console.log('\nCOMMITTED.') }
else { await c.query('rollback'); console.log(failed.length ? '\nROLLED BACK — checks failed.' : '\nROLLED BACK (dry run).') }
await c.end(); process.exit(failed.length ? 1 : 0)
