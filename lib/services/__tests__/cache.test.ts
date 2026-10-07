import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * A build without a database prerenders empty pages. That is fine for CI and
 * previews (warned once per read), and never fine for a production deploy.
 */

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...a: unknown[]) => unknown) => fn,
}))
vi.mock('@/lib/database', () => ({ isDatabaseConfigured: () => false }))

import { cachedRead, resetBuildWarningsForTests } from '@/lib/services/cache'

const read = cachedRead('test-read-v1', async () => ['live'], { tags: () => ['shows'], atBuildWithoutDb: [] as string[] })

beforeEach(() => {
  resetBuildWarningsForTests()
  vi.stubEnv('NEXT_PHASE', 'phase-production-build')
  vi.stubEnv('DATABASE_URL', '')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('cachedRead during a build without a database', () => {
  it('throws in a production build', () => {
    vi.stubEnv('CONTEXT', 'production')
    expect(() => read()).toThrow('DATABASE_URL is required for a production build')
  })

  it('returns the fallback and warns once per key elsewhere', async () => {
    vi.stubEnv('CONTEXT', '')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await read()).toEqual([])
    expect(await read()).toEqual([])
    expect(warn).toHaveBeenCalledOnce()
    expect(String(warn.mock.calls[0][0])).toContain('test-read-v1')
  })
})
