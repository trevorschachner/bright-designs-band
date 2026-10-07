import { describe, it, expect, vi, beforeEach } from 'vitest'

const insert = vi.hoisted(() => vi.fn())
const track = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/lib/database', () => ({ db: { insert: () => ({ values: insert }) } }))
vi.mock('@/lib/database/schema', () => ({ contactSubmissions: {} }))
vi.mock('@/lib/email/service', () => ({ sendEmail: async () => ({ success: true }) }))
vi.mock('@/lib/rate-limit', () => ({ consume: async () => ({ allowed: true }), getClientIp: () => '1.2.3.4' }))
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: async () => true }))
vi.mock('@/lib/env.server', () => ({ getEnv: () => ({ ADMIN_EMAIL: 'admin@example.com' }) }))
vi.mock('@/lib/observability/events', () => ({ trackServerEvent: track }))

import { POST } from '../route'

const request = () =>
  new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Pat Director',
      email: 'pat@school.example',
      message: 'Hello',
      type: 'contact',
      turnstileToken: 'tok',
    }),
  }) as never

beforeEach(() => {
  insert.mockReset().mockResolvedValue(undefined)
  track.mockClear()
})

describe('POST /api/contact events', () => {
  it('tracks contact.received after the row is stored, without the submitter email', async () => {
    const res = await POST(request())
    expect(res.status).toBe(200)
    expect(track).toHaveBeenCalledTimes(1)
    expect(track.mock.invocationCallOrder[0]).toBeGreaterThan(insert.mock.invocationCallOrder[0])
    const [name, props] = track.mock.calls[0] as unknown as [string, Record<string, unknown>]
    expect(name).toBe('contact.received')
    expect(props).toEqual({ type: 'contact', source: 'contact' })
    expect(JSON.stringify(props)).not.toContain('pat@school.example')
  })

  it('tracks nothing when the row was not stored', async () => {
    insert.mockRejectedValue(new Error('db down'))
    await POST(request())
    expect(track).not.toHaveBeenCalled()
  })
})
