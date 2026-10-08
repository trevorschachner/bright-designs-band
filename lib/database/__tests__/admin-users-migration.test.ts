import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * admin_users spans two migration tracks:
 *   - drizzle 0002 (generated) creates the table with its two CHECKs;
 *   - drizzle/migrations/2026-10-08_admin_users.sql (hand-written) seeds it,
 *     adds the RLS helper functions and rewrites every domain-suffix policy.
 * Both are applied by `npm run db:migrate`, so their text is what we check.
 * The expected policy list is parsed from the two migrations that created the
 * suffix policies, so a policy added there later and forgotten here fails.
 */
const drizzleDir = resolve(__dirname, '../../../drizzle')
const dir = resolve(drizzleDir, 'migrations')
const read = (name: string) => readFileSync(resolve(dir, name), 'utf8')

const migration = read('2026-10-08_admin_users.sql')
const rollbackAt = migration.indexOf('-- rollback:')
const forward = migration.slice(0, rollbackAt)
const rollback = migration.slice(rollbackAt)
const stripComments = (sql: string) =>
  sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
const forwardSql = stripComments(forward)

type Policy = { name: string; table: string; command: string; role: string; using: boolean; withCheck: boolean }

function createdPolicies(sql: string): Policy[] {
  return [...sql.matchAll(/create policy "([^"]+)" on (public\.\w+)([^;]*);/g)].map((m) => {
    const body = m[3]
    return {
      name: m[1],
      table: m[2],
      command: /\bfor (\w+)/.exec(body)?.[1] ?? '',
      role: /\bto (\w+)/.exec(body)?.[1] ?? '',
      using: /\busing\s*\(/.test(body),
      withCheck: /\bwith check\s*\(/.test(body),
    }
  })
}

const suffixPolicies = [
  ...createdPolicies(read('2026-08-19_restrict_rls_writes_to_staff.sql')),
  ...createdPolicies(read('2026-10-04_pieces_rls.sql')),
]
const rewritten = new Map(createdPolicies(forwardSql).map((p) => [`${p.table} ${p.name}`, p]))

const journal = JSON.parse(readFileSync(resolve(drizzleDir, 'meta/_journal.json'), 'utf8')) as {
  entries: { idx: number; tag: string }[]
}
const entry0002 = journal.entries.find((e) => e.tag.startsWith('0002_'))
const drizzle0002 = entry0002 ? readFileSync(resolve(drizzleDir, `${entry0002.tag}.sql`), 'utf8') : ''

describe('drizzle 0002 (admin_users table)', () => {
  it('is in the journal', () => {
    expect(entry0002).toBeDefined()
    expect(entry0002!.idx).toBe(2)
  })

  it('creates admin_users with a text key and both CHECK constraints', () => {
    expect(drizzle0002).toMatch(/CREATE TABLE "admin_users"/)
    expect(drizzle0002).toMatch(/"email" text PRIMARY KEY/)
    expect(drizzle0002).toContain('CONSTRAINT "admin_users_email_lower" CHECK (email = lower(email))')
    expect(drizzle0002).toContain(`CONSTRAINT "admin_users_role_check" CHECK (role in ('owner','editor'))`)
    expect(drizzle0002).not.toMatch(/citext/i)
  })

  it('creates contact_rate_limits only if the hand migration has not already', () => {
    expect(drizzle0002).toContain('CREATE TABLE IF NOT EXISTS "contact_rate_limits"')
    expect(drizzle0002).not.toMatch(/CREATE TABLE "contact_rate_limits"/)
  })
})

describe('2026-10-08_admin_users.sql', () => {
  it('found the policies to replace in the older migrations', () => {
    expect(suffixPolicies).toHaveLength(15)
  })

  it('depends on drizzle 0002 and creates neither the table nor an extension', () => {
    expect(forward).toMatch(/DEPENDS ON drizzle migration 0002/)
    expect(forwardSql).not.toMatch(/create table/i)
    expect(forwardSql).not.toMatch(/create extension/i)
    expect(forwardSql).not.toMatch(/citext/i)
  })

  it('seeds the three owners idempotently', () => {
    expect(forwardSql).toContain('on conflict do nothing')
    for (const owner of ['trevor', 'brighton', 'ryan']) {
      expect(forwardSql).toContain(`('${owner}@brightdesigns.band', 'owner'`)
    }
  })

  it('defines is_admin_user and is_admin_owner as stable security definer with a fixed search_path', () => {
    for (const fn of ['is_admin_user', 'is_admin_owner']) {
      const body = forwardSql.slice(forwardSql.indexOf(`create or replace function public.${fn}()`))
      const head = body.slice(0, body.indexOf('$$'))
      expect(head).toMatch(/stable/)
      expect(head).toMatch(/security definer/)
      expect(head).toMatch(/set search_path = public/)
      const fnBody = body.slice(body.indexOf('$$') + 2, body.indexOf('$$', body.indexOf('$$') + 2))
      expect(fnBody).toContain('email = lower(auth.email())')
    }
  })

  it('limits who can execute the helper functions', () => {
    expect(forwardSql).toContain(
      'revoke execute on function public.is_admin_user(), public.is_admin_owner() from public, anon;'
    )
    expect(forwardSql).toContain('grant execute on function public.is_admin_user(), public.is_admin_owner() to authenticated;')
  })

  it('enables RLS on admin_users', () => {
    expect(forwardSql).toContain('alter table public.admin_users enable row level security')
  })

  it('has no domain-suffix predicate left in the executable forward section', () => {
    expect(forwardSql).not.toMatch(/like\s+'%@brightdesigns\.band'/)
    // The three seeded owners, plus the pattern the apply-time assertion scans for.
    expect(forwardSql.match(/brightdesigns\.band/g)).toHaveLength(5)
  })

  it('asserts at apply time that no policy in any schema still uses the domain', () => {
    const block = forwardSql.slice(forwardSql.indexOf('do $$'), forwardSql.lastIndexOf('commit;'))
    expect(block).toContain('from pg_policies')
    expect(block).not.toMatch(/schemaname\s*=/) // every schema, storage.objects included
    expect(block).toContain("coalesce(qual, '') ilike '%brightdesigns.band%'")
    expect(block).toContain("coalesce(with_check, '') ilike '%brightdesigns.band%'")
    expect(block).toContain('raise exception')
    expect(forwardSql.indexOf('do $$')).toBeGreaterThan(forwardSql.lastIndexOf('create policy'))
  })

  it('drops and recreates every suffix policy with is_admin_user(), same command, role and clauses', () => {
    for (const original of suffixPolicies) {
      const { name, table } = original
      const drops = forwardSql.split(`drop policy if exists "${name}" on ${table};`).length - 1
      expect(drops, name).toBe(1)
      const next = rewritten.get(`${table} ${name}`)
      expect(next, name).toBeDefined()
      expect({ ...next!, name, table }, name).toEqual(original)
      const create = forwardSql.match(new RegExp(`create policy "${name}" on ${table.replace('.', '\\.')}[^;]*;`))
      expect(create![0], name).toContain('public.is_admin_user()')
    }
  })

  it('has a rollback section, commented out, that restores the suffix policies and drops the functions', () => {
    expect(rollbackAt).toBeGreaterThan(0)
    const lines = rollback.split('\n').filter((l) => l.trim())
    expect(lines.every((l) => l.trim().startsWith('--'))).toBe(true)
    for (const { name, table } of suffixPolicies) {
      expect(rollback, name).toContain(`-- create policy "${name}" on ${table}`)
    }
    expect(rollback).toMatch(/like '%@brightdesigns\.band'/)
    expect(rollback).toContain('drop function if exists public.is_admin_user()')
    expect(rollback).toContain('drop function if exists public.is_admin_owner()')
  })
})
