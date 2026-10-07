import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import type { SQL } from 'drizzle-orm'

/**
 * Dashboard reads against a mocked db: each `db.select()` chain records the
 * table it reads and its where clause, and resolves to rows the test supplies
 * per table. The where clauses are rendered with the real Postgres dialect, so
 * the tests check the SQL each attention list runs.
 */

const state = vi.hoisted(() => ({
  chains: [] as { table: string; where?: unknown }[],
  rows: {} as Record<string, unknown[]>,
}))

vi.mock('@/lib/database', async () => {
  const { getTableName } = await import('drizzle-orm')
  const select = () => {
    const record: { table: string; where?: unknown } = { table: '' }
    const chain = {
      from(table: Parameters<typeof getTableName>[0]) {
        record.table = getTableName(table)
        state.chains.push(record)
        return chain
      },
      leftJoin: () => chain,
      where(where: unknown) {
        record.where = where
        return chain
      },
      orderBy: () => chain,
      limit: () => chain,
      offset: () => chain,
      then(resolve: (rows: unknown[]) => void) {
        resolve(state.rows[record.table] ?? [])
      },
    }
    return chain
  }
  return { db: { select } }
})

import {
  ATTENTION_ITEMS,
  ATTENTION_WHERE,
  getNeedsAttention,
  getRecentEdits,
  mergeRecentEdits,
  type RecentEdit,
} from '@/lib/services/admin-dashboard'

const dialect = new PgDialect()
const render = (where: SQL) => dialect.sqlToQuery(where)

beforeEach(() => {
  state.chains = []
  state.rows = {}
})

describe('attention conditions', () => {
  it('shows with no poster: thumbnail_url null or empty', () => {
    const { sql, params } = render(ATTENTION_WHERE.showsWithoutPoster())
    expect(sql).toBe('("shows"."thumbnail_url" is null or "shows"."thumbnail_url" = $1)')
    expect(params).toEqual([''])
  })

  it('shows with a short description: null or under 40 trimmed characters', () => {
    const { sql, params } = render(ATTENTION_WHERE.showsWithShortDescription())
    expect(sql).toBe('("shows"."description" is null or char_length(btrim("shows"."description")) < $1)')
    expect(params).toEqual([40])
  })

  it('arrangements with no public audio file', () => {
    const { sql, params } = render(ATTENTION_WHERE.arrangementsWithoutAudio())
    expect(sql).toMatch(/^not exists \(select 1 from "files" where/)
    expect(sql).toContain('"files"."arrangement_id" = "arrangements"."id"')
    expect(sql).toContain('"files"."file_type" = $1')
    expect(sql).toContain('"files"."is_public" = $2')
    expect(params).toEqual(['audio', true])
  })

  it('arrangements with no pieces linked', () => {
    const { sql } = render(ATTENTION_WHERE.arrangementsWithoutPieces())
    expect(sql).toBe(
      'not exists (select 1 from "arrangement_pieces" where "arrangement_pieces"."arrangement_id" = "arrangements"."id")',
    )
  })
})

describe('getNeedsAttention', () => {
  it('runs the four lists, counts every match and lists the first few with editor links', async () => {
    const manyShows = Array.from({ length: ATTENTION_ITEMS + 3 }, (_, i) => ({ id: i + 1, slug: `s-${i + 1}`, title: `Show ${i + 1}` }))
    state.rows = {
      shows: manyShows,
      arrangements: [
        { id: 5, title: 'Part 1', showSlug: 'apex' },
        { id: 5, title: 'Part 1', showSlug: 'other' }, // shared part: listed once
        { id: 6, title: 'Orphan', showSlug: null },
      ],
    }

    const groups = await getNeedsAttention()

    expect(groups.map((g) => g.key)).toEqual([
      'showsWithoutPoster',
      'showsWithShortDescription',
      'arrangementsWithoutAudio',
      'arrangementsWithoutPieces',
    ])
    expect(state.chains.map((c) => c.table)).toEqual(['shows', 'shows', 'arrangements', 'arrangements'])
    for (const chain of state.chains) expect(chain.where).toBeDefined()

    const [poster, , audio] = groups
    expect(poster.count).toBe(ATTENTION_ITEMS + 3)
    expect(poster.items).toHaveLength(ATTENTION_ITEMS)
    expect(poster.items[0]).toEqual({ id: 1, title: 'Show 1', href: '/admin/shows/s-1' })

    expect(audio.count).toBe(2)
    expect(audio.items).toEqual([
      { id: 5, title: 'Part 1', href: '/admin/shows/apex' },
      { id: 6, title: 'Orphan', href: '/admin/arrangements?q=Orphan' },
    ])
  })
})

describe('recently edited', () => {
  const edit = (kind: RecentEdit['kind'], id: number, updatedAt: string): RecentEdit => ({
    kind,
    id,
    title: `${kind} ${id}`,
    updatedAt,
    href: '#',
  })

  it('merges both lists newest first and keeps the limit', () => {
    const merged = mergeRecentEdits(
      [edit('show', 1, '2026-10-01T00:00:00.000Z'), edit('show', 2, '2026-10-05T00:00:00.000Z')],
      [edit('arrangement', 3, '2026-10-03T00:00:00.000Z'), edit('arrangement', 4, '2026-10-06T00:00:00.000Z')],
      3,
    )
    expect(merged.map((e) => `${e.kind}:${e.id}`)).toEqual(['arrangement:4', 'show:2', 'arrangement:3'])
  })

  it('breaks a tie shows first, then by newest id', () => {
    const at = '2026-10-01T00:00:00.000Z'
    const merged = mergeRecentEdits([edit('show', 1, at), edit('show', 2, at)], [edit('arrangement', 9, at)], 10)
    expect(merged.map((e) => `${e.kind}:${e.id}`)).toEqual(['show:2', 'show:1', 'arrangement:9'])
  })

  it('reads both tables, dedupes shared parts and links each row to its editor', async () => {
    state.rows = {
      shows: [{ id: 1, slug: 'apex', title: 'Apex', updatedAt: new Date('2026-10-02T00:00:00Z') }],
      arrangements: [
        { id: 7, title: 'Part 2', updatedAt: new Date('2026-10-04T00:00:00Z'), showSlug: 'apex' },
        { id: 7, title: 'Part 2', updatedAt: new Date('2026-10-04T00:00:00Z'), showSlug: 'other' },
      ],
    }
    const edits = await getRecentEdits(10)
    expect(edits).toEqual([
      { kind: 'arrangement', id: 7, title: 'Part 2', updatedAt: '2026-10-04T00:00:00.000Z', href: '/admin/shows/apex' },
      { kind: 'show', id: 1, title: 'Apex', updatedAt: '2026-10-02T00:00:00.000Z', href: '/admin/shows/apex' },
    ])
  })
})
