#!/usr/bin/env tsx
/**
 * Apply the hand-written SQL migration track in `drizzle/migrations/`.
 *
 * drizzle-kit only executes migrations it generated itself, so files written
 * here were never run — see lib/database/sql-migrations.ts for what that cost.
 * This runner tracks them in `public.__sql_migrations` by name and checksum.
 *
 *   npx tsx scripts/apply-sql-migrations.ts            # show what is pending
 *   npx tsx scripts/apply-sql-migrations.ts --apply    # apply pending files
 *   npx tsx scripts/apply-sql-migrations.ts --baseline # mark all as applied
 *   npx tsx scripts/apply-sql-migrations.ts --apply --only <file.sql>
 *                                                      # apply one pending file
 *
 * A file containing the line `-- migrate: manual` is held back from a plain
 * `--apply` (it stays pending, and is listed as held) and runs only with
 * `--only <its name>`. For steps that must wait for a human action first
 * (e.g. 2026-10-09_storage_public_select.sql waits for migrate-private-files).
 *
 * `--baseline` is for adopting this on a database whose migrations were
 * already applied by hand. It records without executing, so use it once.
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { readdir, readFile } from 'fs/promises'
import postgres from 'postgres'
import { checksum, pendingMigrations, planApply, selectMigrationFiles } from '../lib/database/sql-migrations'

config({ path: resolve(process.cwd(), '.env.local') })

/** Thin query wrapper over one `postgres` connection (max: 1 keeps begin/commit on the same session). */
type Db = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number }>
  end: () => Promise<void>
}

function connect(url: string): Db {
  const sql = postgres(url, { max: 1, prepare: false, ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer' })
  return {
    query: async (text, params) => {
      const result = params
        ? await sql.unsafe(text, params as postgres.ParameterOrJSON<never>[])
        : await sql.unsafe(text)
      return { rows: [...result] as Record<string, unknown>[], rowCount: result.count }
    },
    end: () => sql.end(),
  }
}

const DIR = resolve(process.cwd(), 'drizzle/migrations')

async function main() {
  const apply = process.argv.includes('--apply')
  const baseline = process.argv.includes('--baseline')
  const onlyIndex = process.argv.indexOf('--only')
  const only = onlyIndex === -1 ? null : process.argv[onlyIndex + 1] ?? null
  if (onlyIndex !== -1 && (!only || only.startsWith('--'))) throw new Error('--only requires a migration file name')
  if (only && baseline) throw new Error('--only cannot be combined with --baseline')
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not found in .env.local')

  const db = connect(process.env.DATABASE_URL)
  try {
    await db.query(`create table if not exists public.__sql_migrations (
      name text primary key, checksum text not null, applied_at timestamptz not null default now())`)

    const files = selectMigrationFiles(await readdir(DIR))
    const contents: Record<string, string> = {}
    for (const name of files) contents[name] = await readFile(resolve(DIR, name), 'utf8')

    const { rows: rawRows } = await db.query(
      'select name, checksum from public.__sql_migrations')
    const rows = rawRows as { name: string; checksum: string }[]
    const { pending, drifted } = pendingMigrations(files, rows, contents)

    if (drifted.length) {
      console.error('\nThese files changed after being applied. The database and the file no longer agree:')
      for (const name of drifted) console.error(`  ${name}`)
      console.error('Resolve by hand — re-running an applied migration is not safe.\n')
      process.exitCode = 1
    }

    if (baseline) {
      for (const name of pending) {
        await db.query(
          'insert into public.__sql_migrations (name, checksum) values ($1,$2) on conflict (name) do nothing',
          [name, checksum(contents[name])])
        console.log(`  recorded (not executed): ${name}`)
      }
      console.log(`\nBaselined ${pending.length} migration(s).`)
      return
    }

    if (pending.length === 0) {
      console.log('No pending SQL migrations.')
      return
    }

    const plan = planApply(pending, contents, only)
    for (const name of plan.held) console.log(`  held (manual; apply with --only ${name}): ${name}`)
    console.log(`${apply ? 'Applying' : 'Pending'} ${plan.apply.length} migration(s):`)
    for (const name of plan.apply) {
      if (!apply) { console.log(`  ${name}`); continue }
      await db.query('begin')
      try {
        // The file may carry its own begin/commit; strip so this transaction owns it.
        await db.query(contents[name].replace(/^\s*(begin|commit);\s*$/gim, ''))
        await db.query('insert into public.__sql_migrations (name, checksum) values ($1,$2)',
          [name, checksum(contents[name])])
        await db.query('commit')
        console.log(`  applied ${name}`)
      } catch (error) {
        await db.query('rollback')
        console.error(`  FAILED ${name}: ${error instanceof Error ? error.message : error}`)
        throw error
      }
    }
    if (!apply) console.log('\nRe-run with --apply to execute them.')
  } finally {
    await db.end()
  }
}

main().catch((e) => { console.error(`\nError: ${e instanceof Error ? e.message : e}`); process.exit(1) })
