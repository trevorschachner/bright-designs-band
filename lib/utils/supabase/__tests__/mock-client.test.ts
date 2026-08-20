import { describe, expect, it } from 'vitest'
import { createSupabaseMock } from '../mock-client'

describe('createSupabaseMock', () => {
  it('implements every auth method callers use', async () => {
    // The mock is cast with `as unknown as`, so the compiler cannot catch a
    // caller reaching for a method it does not define. guard() calling
    // getUser() on a getSession-only mock turned clean 401s into 500s.
    const mock = createSupabaseMock()
    for (const method of ['getUser', 'getSession'] as const) {
      expect(typeof mock.auth[method]).toBe('function')
    }
  })

  it('resolves to a signed-out result rather than throwing', async () => {
    const mock = createSupabaseMock()
    await expect(mock.auth.getUser()).resolves.toEqual({ data: { user: null }, error: null })
    await expect(mock.auth.getSession()).resolves.toEqual({ data: { session: null }, error: null })
  })
})
