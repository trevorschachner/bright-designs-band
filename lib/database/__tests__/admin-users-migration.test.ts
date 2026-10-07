import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * The migration is applied by hand, so its text is what we can check here.
 * The expected policy list is parsed from the two migrations that created the
 * suffix policies, so a policy added there later and forgotten here fails.
 */
const dir = resolve(__dirname, '../../../drizzle/migrations')
const read = (name: string) => readFileSync(resolve(dir, name), 'utf8')

const migration = read('2026-10-08_admin_users.sql')
const rollbackAt = migration.indexOf('-- rollback:')
const forward = migration.slice(0, rollbackAt)
const rollback = migration.slice(rollbackAt)
// Executable forward SQL: comment lines stripped.
const forwardSql = forward
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')

function createdPolicies(sql: string): { name: string; table: string }[] {
  return [...sql.matchAll(/create policy "([^"]+)" on (public\.\w+)/g)].map((m) => ({ name: m[1], table: m[2] }))
}

const suffixPolicies = [
  ...createdPolicies(read('2026-08-19_restrict_rls_writes_to_staff.sql')),
  ...createdPolicies(read('2026-10-04_pieces_rls.sql')),
]

describe('2026-10-08_admin_users.sql', () => {
  it('found the policies to replace in the older migrations', () => {
    expect(suffixPolicies).toHaveLength(15)
  })

  it('creates the allowlist idempotently', () => {
    expect(forwardSql).toContain('create extension if not exists citext')
    expect(forwardSql).toContain('create table if not exists public.admin_users')
    expect(forwardSql).toMatch(/email citext primary key/)
    expect(forwardSql).toMatch(/check \(role in \('owner', 'editor'\)\)/)
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
    }
  })

  it('enables RLS on admin_users', () => {
    expect(forwardSql).toContain('alter table public.admin_users enable row level security')
  })

  it('has no domain-suffix predicate left in the executable forward section', () => {
    expect(forwardSql).not.toMatch(/like\s+'%@brightdesigns\.band'/)
    // The only domain strings left are the three seeded owners.
    expect(forwardSql.match(/brightdesigns\.band/g)).toHaveLength(3)
  })

  it('drops and recreates every suffix policy with is_admin_user()', () => {
    for (const { name, table } of suffixPolicies) {
      const drops = forwardSql.split(`drop policy if exists "${name}" on ${table};`).length - 1
      expect(drops, name).toBe(1)
      const create = forwardSql.match(new RegExp(`create policy "${name}" on ${table.replace('.', '\\.')}[^;]*;`))
      expect(create, name).not.toBeNull()
      expect(create![0], name).toContain('public.is_admin_user()')
    }
  })

  it('has a rollback section, commented out, that restores the suffix policies and drops the allowlist', () => {
    expect(rollbackAt).toBeGreaterThan(0)
    const lines = rollback.split('\n').filter((l) => l.trim())
    expect(lines.every((l) => l.trim().startsWith('--'))).toBe(true)
    for (const { name, table } of suffixPolicies) {
      expect(rollback, name).toContain(`-- create policy "${name}" on ${table}`)
    }
    expect(rollback).toMatch(/like '%@brightdesigns\.band'/)
    expect(rollback).toContain('drop function if exists public.is_admin_user()')
    expect(rollback).toContain('drop function if exists public.is_admin_owner()')
    expect(rollback).toContain('drop table if exists public.admin_users')
  })
})
