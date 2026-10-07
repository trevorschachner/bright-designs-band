import { describe, it, expect } from 'vitest'
import { sql, type SQL } from 'drizzle-orm'
import { PgDialect } from 'drizzle-orm/pg-core'
import { shows, arrangements } from '@/lib/database/schema'
import { buildTableQuery, UnknownFilterFieldError } from '../table-query'

// The seam is the pure plan builder: it turns a FilterState into a where clause
// and an order-by, and never touches a database. The thin executor around it is
// what runs the plan. Same split as guard() over resolveAuthorization().

const state = (conditions: any[] = [], sort: any[] = [], search?: string) =>
  ({ conditions, sort, search } as never)

describe('relation fields', () => {
  // SHOWS_FILTER_FIELDS offers `tags`, and the shows route passed it straight to
  // buildWhereClause, which looks the field up as a column, does not find one,
  // and throws. The route's catch turned that into a 500, so filtering shows by
  // tag has never worked from the UI.
  it('resolves a relation condition through its handler instead of as a column', () => {
    const plan = buildTableQuery(
      shows,
      state([{ field: 'tags', operator: 'in', values: [1, 2] }]),
      { relations: { tags: (ids) => sql`${shows.id} in (${ids.join(',')})` } }
    )
    expect(plan.where).toBeDefined()
  })
})

describe('unknown fields', () => {
  // A filter naming a column the table does not have is the client sending
  // something wrong, not the server breaking. QueryBuilder threw a bare Error
  // and both routes' catch-all turned it into a 500, which is how the dead
  // `type` and `price` filters presented for nine months.
  it('reports an unknown condition field as UnknownFilterFieldError', () => {
    expect(() =>
      buildTableQuery(shows, state([{ field: 'nonesuch', operator: 'equals', value: 'x' }]))
    ).toThrow(UnknownFilterFieldError)
  })

  it('reports an unknown sort field as UnknownFilterFieldError', () => {
    expect(() =>
      buildTableQuery(shows, state([], [{ field: 'nonesuch', direction: 'asc' }]))
    ).toThrow(UnknownFilterFieldError)
  })
})

describe('composition', () => {
  it('combines search, column conditions, relations and route-supplied predicates', () => {
    const plan = buildTableQuery(
      arrangements,
      state(
        [
          { field: 'tags', operator: 'in', values: [3] },
          { field: 'scene', operator: 'equals', value: 'Opener' },
        ],
        [{ field: 'title', direction: 'asc' }],
        'fanfare'
      ),
      {
        searchable: ['title', 'composer'],
        relations: { tags: (ids) => sql`${arrangements.id} in (${ids.join(',')})` },
        extra: [sql`1 = 1`],
      }
    )
    expect(plan.where).toBeDefined()
    expect(plan.orderBy).toHaveLength(1)
  })

  it('sorts blanks last in both directions', () => {
    const render = (o: unknown) => new PgDialect().sqlToQuery(o as SQL).sql
    for (const direction of ['asc', 'desc'] as const) {
      const plan = buildTableQuery(shows, state([], [{ field: 'difficulty', direction }]), { defaultOrderBy: [] })
      expect(render(plan.orderBy[0])).toBe(`"shows"."difficulty" ${direction} nulls last`)
    }
  })

  it('returns no where clause and the default ordering for an empty filter state', () => {
    const fallback = [sql`${shows.displayOrder}`]
    const plan = buildTableQuery(shows, state(), { defaultOrderBy: fallback })
    expect(plan.where).toBeUndefined()
    expect(plan.orderBy).toBe(fallback)
  })
})
