import { describe, it, expect, beforeEach, vi } from 'vitest'

let upsertImpl: () => Promise<{ count: number }[]> = async () => [{ count: 1 }]
const upserted: { values: Record<string, unknown> }[] = []

vi.mock('@/lib/database', () => ({
  db: {
    insert: () => ({
      values: (values: Record<string, unknown>) => ({
        onConflictDoUpdate: () => ({
          returning: () => {
            upserted.push({ values })
            return upsertImpl()
          },
        }),
      }),
    }),
  },
}))

import { consume, getClientIp, windowStartFor } from '@/lib/rate-limit'

beforeEach(() => {
  upsertImpl = async () => [{ count: 1 }]
  upserted.length = 0
})

describe('windowStartFor', () => {
  it('truncates to the start of the 10-minute window', () => {
    expect(windowStartFor(new Date('2026-10-07T12:34:56.789Z'), 10).toISOString()).toBe('2026-10-07T12:30:00.000Z')
    expect(windowStartFor(new Date('2026-10-07T12:30:00.000Z'), 10).toISOString()).toBe('2026-10-07T12:30:00.000Z')
    expect(windowStartFor(new Date('2026-10-07T12:39:59.999Z'), 10).toISOString()).toBe('2026-10-07T12:30:00.000Z')
    expect(windowStartFor(new Date('2026-10-07T12:40:00.000Z'), 10).toISOString()).toBe('2026-10-07T12:40:00.000Z')
  })

  it('handles other window sizes', () => {
    expect(windowStartFor(new Date('2026-10-07T12:34:56Z'), 60).toISOString()).toBe('2026-10-07T12:00:00.000Z')
    expect(windowStartFor(new Date('2026-10-07T12:34:56Z'), 1).toISOString()).toBe('2026-10-07T12:34:00.000Z')
  })
})

describe('consume', () => {
  const opts = { limit: 5, windowMinutes: 10 }
  const now = new Date('2026-10-07T12:34:00Z')

  it('upserts into the truncated window and allows up to the limit', async () => {
    upsertImpl = async () => [{ count: 5 }]
    const result = await consume('203.0.113.9', opts, now)
    expect(result).toEqual({ allowed: true, remaining: 0, retryAfterSeconds: 360 })
    expect(upserted[0].values).toEqual({
      ip: '203.0.113.9',
      windowStart: new Date('2026-10-07T12:30:00Z'),
      count: 1,
    })
  })

  it('denies once the count exceeds the limit', async () => {
    upsertImpl = async () => [{ count: 6 }]
    const result = await consume('203.0.113.9', opts, now)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfterSeconds).toBe(360)
  })

  it('fails open when the database errors', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    upsertImpl = async () => {
      throw new Error('connection refused')
    }
    const result = await consume('203.0.113.9', opts, now)
    expect(result.allowed).toBe(true)
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })
})

describe('getClientIp', () => {
  it('prefers the Netlify header, then the first x-forwarded-for entry', () => {
    expect(getClientIp(new Headers({ 'x-nf-client-connection-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' }))).toBe('1.1.1.1')
    expect(getClientIp(new Headers({ 'x-forwarded-for': ' 2.2.2.2 , 3.3.3.3' }))).toBe('2.2.2.2')
    expect(getClientIp(new Headers())).toBe('unknown')
  })
})
