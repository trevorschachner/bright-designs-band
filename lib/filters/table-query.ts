import { and, asc, desc, type SQL } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { QueryBuilder } from './query-builder'
import type { FilterState } from './types'

/**
 * Turns a FilterState into the where clause and ordering a query needs.
 *
 * Pure on purpose. Executing the plan needs a database; deciding what the plan
 * is does not, which is what makes the decision testable. Same split as
 * guard() over resolveAuthorization().
 *
 * QueryBuilder left this work to its callers, and the two callers did it
 * differently: app/api/arrangements filtered relation conditions out and handled
 * `tags` with an exists subquery, app/api/shows passed everything through, so
 * filtering shows by `tags` or `arrangements` hit buildWhereClause's
 * "Column not found" throw and surfaced as a 500.
 */

/** A relation condition names no column. The caller supplies the predicate. */
export type RelationHandler = (ids: number[]) => SQL

export interface TableQueryOptions {
  /** Columns a free-text search should cover. */
  searchable?: string[]
  /** Filter fields that are relations rather than columns, keyed by field name. */
  relations?: Record<string, RelationHandler>
  /** Predicates the route adds itself, e.g. a `featured` flag. */
  extra?: SQL[]
  /** Ordering to use when the caller asked for none. */
  defaultOrderBy?: OrderBy[]
}

/** Drizzle accepts a bare column or an SQL expression for ordering. */
export type OrderBy = SQL | PgColumn

export interface TableQueryPlan {
  where: SQL | undefined
  orderBy: OrderBy[]
}

export function buildTableQuery(
  table: PgTable,
  filterState: FilterState,
  options: TableQueryOptions = {}
): TableQueryPlan {
  const { searchable = [], relations = {}, extra = [], defaultOrderBy = [] } = options
  const predicates: SQL[] = []

  if (filterState.search && searchable.length > 0) {
    const search = QueryBuilder.buildSearchCondition(table, filterState.search, searchable)
    if (search) predicates.push(search)
  }

  const conditions = filterState.conditions ?? []
  const columnConditions = conditions.filter(c => !(c.field in relations))

  for (const condition of conditions) {
    const handler = relations[condition.field]
    if (!handler) continue
    const ids = (condition.values ?? [condition.value]).map(Number).filter(n => !Number.isNaN(n))
    if (ids.length > 0) predicates.push(handler(ids))
  }

  if (columnConditions.length > 0) {
    // Check the fields before delegating. QueryBuilder throws a bare Error for a
    // missing column, which both routes' catch-all reported as a 500; naming the
    // failure lets a route answer 400 instead. The operator logic below it is
    // sound, so it keeps building the clause.
    for (const condition of columnConditions) {
      if (!(condition.field in table)) throw new UnknownFilterFieldError(condition.field)
    }
    const columnClause = QueryBuilder.buildWhereClause(table, columnConditions)
    if (columnClause) predicates.push(columnClause)
  }

  predicates.push(...extra)

  const where =
    predicates.length === 0 ? undefined : predicates.length === 1 ? predicates[0] : and(...predicates)

  const sort = filterState.sort ?? []
  const orderBy = sort.length > 0 ? buildOrderBy(table, sort) : defaultOrderBy

  return { where, orderBy }
}

function buildOrderBy(table: PgTable, sort: FilterState['sort']): OrderBy[] {
  return sort.map(entry => {
    const column = table[entry.field as keyof typeof table] as PgColumn | undefined
    if (!column) throw new UnknownFilterFieldError(entry.field)
    return entry.direction === 'asc' ? asc(column) : desc(column)
  })
}

/** A filter naming something the table does not have is a bad request, not a server fault. */
export class UnknownFilterFieldError extends Error {
  constructor(readonly field: string) {
    super(`Unknown filter field: ${field}`)
    this.name = 'UnknownFilterFieldError'
  }
}
