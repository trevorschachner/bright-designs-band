import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * lib/database must be importable without DATABASE_URL (build, CI, tests) and
 * fail clearly on first use instead.
 */

const postgresFactory = vi.fn(() => ({}))
vi.mock('postgres', () => ({ default: postgresFactory }))

const saved = process.env.DATABASE_URL

beforeEach(() => {
  vi.resetModules()
  postgresFactory.mockClear()
  delete (globalThis as { __bdbDatabase?: unknown }).__bdbDatabase
})

afterEach(() => {
  if (saved === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = saved
})

describe('lazy database', () => {
  it('imports without DATABASE_URL and opens no connection', async () => {
    delete process.env.DATABASE_URL
    const mod = await import('@/lib/database')
    expect(mod.db).toBeDefined()
    expect(mod.isDatabaseConfigured()).toBe(false)
    expect(postgresFactory).not.toHaveBeenCalled()
  })

  it('throws a clear error on first use without DATABASE_URL', async () => {
    delete process.env.DATABASE_URL
    const { db, DATABASE_URL_MISSING } = await import('@/lib/database')
    expect(() => db.select()).toThrow(DATABASE_URL_MISSING)
    expect(DATABASE_URL_MISSING).toMatch(/DATABASE_URL is not set/)
  })

  it('can be awaited and returned from an async function without creating the client', async () => {
    delete process.env.DATABASE_URL
    const { db } = await import('@/lib/database')
    const viaAsync = async () => db
    expect(await viaAsync()).toBe(db)
    expect(await db).toBe(db)
    expect(postgresFactory).not.toHaveBeenCalled()
  })

  it('survives `in` and util.inspect without DATABASE_URL', async () => {
    delete process.env.DATABASE_URL
    const { db } = await import('@/lib/database')
    const { inspect } = await import('node:util')
    expect(() => 'select' in db).not.toThrow()
    expect('select' in db).toBe(false)
    expect(() => inspect(db)).not.toThrow()
    expect(postgresFactory).not.toHaveBeenCalled()
  })

  it('creates one small pool on first use and reuses it', async () => {
    process.env.DATABASE_URL = 'postgresql://u:p@127.0.0.1:5432/x'
    const { db, getDb } = await import('@/lib/database')
    expect(postgresFactory).not.toHaveBeenCalled()
    expect(typeof db.select).toBe('function')
    expect(getDb()).toBe(getDb())
    expect(postgresFactory).toHaveBeenCalledTimes(1)
    const [, options] = postgresFactory.mock.calls[0] as unknown as [string, { max: number }]
    expect(options.max).toBe(5)
  })
})
