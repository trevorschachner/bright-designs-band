import { getTableName, type Table } from 'drizzle-orm'

/**
 * A recording stand-in for the Drizzle client, for action tests.
 *
 * Every query builder chain (select/insert/update/delete, any order of
 * where/limit/for/values/set/returning/onConflict...) is recorded as one `Op`
 * when awaited, and resolves to whatever `respond(op)` returns. `where`
 * conditions are not evaluated: a test answers per table and kind.
 * `transaction(fn)` runs `fn` with the same client and logs begin / commit /
 * rollback into `events`, so a test can assert that invalidation came after
 * the commit (push into `events` from the invalidate mock).
 */

export type Op = {
  kind: 'select' | 'insert' | 'update' | 'delete'
  table: string
  values?: unknown
  set?: Record<string, unknown>
  lock?: string
  onConflict?: unknown
  inTransaction: boolean
}

export type Respond = (op: Op) => unknown[] | Promise<unknown[]>

export function createFakeDb(respond: Respond) {
  const ops: Op[] = []
  const events: string[] = []

  function chain(op: Op) {
    const self: Record<string, unknown> = {}
    const pass = () => self
    Object.assign(self, {
      from: (table: Table) => {
        op.table = getTableName(table)
        return self
      },
      where: pass,
      limit: pass,
      orderBy: pass,
      innerJoin: pass,
      leftJoin: pass,
      returning: pass,
      for: (lock: string) => {
        op.lock = lock
        return self
      },
      values: (values: unknown) => {
        op.values = values
        return self
      },
      set: (set: Record<string, unknown>) => {
        op.set = set
        return self
      },
      onConflictDoNothing: () => {
        op.onConflict = 'nothing'
        return self
      },
      onConflictDoUpdate: (config: unknown) => {
        op.onConflict = config
        return self
      },
      then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
        ops.push(op)
        events.push(`${op.kind}:${op.table}`)
        return Promise.resolve()
          .then(() => respond(op))
          .then(resolve, reject)
      },
    })
    return self
  }

  function client(inTransaction: boolean): Record<string, unknown> {
    return {
      select: () => chain({ kind: 'select', table: '', inTransaction }),
      insert: (table: Table) => chain({ kind: 'insert', table: getTableName(table), inTransaction }),
      update: (table: Table) => chain({ kind: 'update', table: getTableName(table), inTransaction }),
      delete: (table: Table) => chain({ kind: 'delete', table: getTableName(table), inTransaction }),
      transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
        events.push('begin')
        try {
          const result = await fn(client(true))
          events.push('commit')
          return result
        } catch (error) {
          events.push('rollback')
          throw error
        }
      },
    }
  }

  return { db: client(false), ops, events }
}

/** Ops on one table, of one kind. */
export const opsOn = (ops: Op[], table: string, kind?: Op['kind']) =>
  ops.filter((op) => op.table === table && (!kind || op.kind === kind))
