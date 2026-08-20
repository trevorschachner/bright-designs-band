import { describe, expect, it } from 'vitest'
import { checksum, pendingMigrations, selectMigrationFiles } from '../sql-migrations'

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
