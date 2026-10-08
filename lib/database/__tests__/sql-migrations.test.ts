import { describe, expect, it } from 'vitest'
import { checksum, pendingMigrations, planApply, selectMigrationFiles } from '../sql-migrations'

describe('selectMigrationFiles', () => {
  it('orders by filename so dated migrations apply chronologically', () => {
    expect(selectMigrationFiles(['2026-01-02_b.sql', '2025-11-02_a.sql', '2025-12-02_c.sql']))
      .toEqual(['2025-11-02_a.sql', '2025-12-02_c.sql', '2026-01-02_b.sql'])
  })

  it('excludes rollback scripts — they are run deliberately, never automatically', () => {
    expect(selectMigrationFiles(['a.sql', 'a.rollback.sql'])).toEqual(['a.sql'])
  })

  it('ignores non-sql files', () => {
    expect(selectMigrationFiles(['a.sql', 'README.md', '.DS_Store'])).toEqual(['a.sql'])
  })
})

describe('pendingMigrations', () => {
  const applied = [{ name: 'a.sql', checksum: checksum('select 1') }]

  it('returns only files with no applied record', () => {
    expect(pendingMigrations(['a.sql', 'b.sql'], applied, { 'a.sql': 'select 1', 'b.sql': 'select 2' }))
      .toEqual({ pending: ['b.sql'], drifted: [] })
  })

  it('flags an applied file whose contents changed after the fact', () => {
    // Editing an already-applied migration means the database and the file no
    // longer agree, and re-running is not safe. Surface it rather than guess.
    expect(pendingMigrations(['a.sql'], applied, { 'a.sql': 'select 999' }))
      .toEqual({ pending: [], drifted: ['a.sql'] })
  })

  it('reports nothing to do when everything matches', () => {
    expect(pendingMigrations(['a.sql'], applied, { 'a.sql': 'select 1' }))
      .toEqual({ pending: [], drifted: [] })
  })
})

describe('planApply', () => {
  const contents = { 'a.sql': 'select 1', 'b.sql': '-- migrate: manual\nselect 2', 'c.sql': 'select 3' }

  it('holds manual files back from a plain apply', () => {
    expect(planApply(['a.sql', 'b.sql', 'c.sql'], contents, null)).toEqual({ apply: ['a.sql', 'c.sql'], held: ['b.sql'] })
  })

  it('--only applies just that pending file, manual or not', () => {
    expect(planApply(['a.sql', 'b.sql', 'c.sql'], contents, 'b.sql')).toEqual({ apply: ['b.sql'], held: [] })
    expect(planApply(['a.sql', 'b.sql'], contents, 'a.sql')).toEqual({ apply: ['a.sql'], held: ['b.sql'] })
  })

  it('--only refuses a file that is not pending', () => {
    expect(() => planApply(['a.sql'], contents, 'c.sql')).toThrow(/not a pending migration/)
  })
})
