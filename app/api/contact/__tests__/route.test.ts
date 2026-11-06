import { describe, it, expect, vi, beforeEach } from 'vitest'

const insert = vi.hoisted(() => vi.fn((_row: unknown) => Promise.resolve([] as Array<{ id: number }>)))
const track = vi.hoisted(() => vi.fn(async () => {}))
const update = vi.hoisted(() => vi.fn(async (_values: unknown) => {}))
const attio = vi.hoisted(() => ({ sync: vi.fn(), apiKey: undefined as string | undefined }))
const report = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/lib/database', () => ({
  db: {
    insert: () => ({ values: (row: unknown) => ({ returning: () => insert(row) }) }),
    update: () => ({ set: (values: unknown) => ({ where: () => update(values) }) }),
  },
}))
vi.mock('@/lib/database/schema', () => ({ contactSubmissions: { id: 'id' } }))
vi.mock('@/lib/integrations/attio', () => ({ syncSubmissionToAttio: attio.sync }))
vi.mock('@/lib/observability/report-error', () => ({ reportError: report }))
vi.mock('@/lib/email/service', () => ({ sendEmail: async () => ({ success: true }) }))
vi.mock('@/lib/rate-limit', () => ({ consume: async () => ({ allowed: true }), getClientIp: () => '1.2.3.4' }))
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: async () => true }))
vi.mock('@/lib/env.server', () => ({ getEnv: () => ({ ADMIN_EMAIL: 'admin@example.com', ATTIO_API_KEY: attio.apiKey }) }))
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
  insert.mockReset().mockResolvedValue([{ id: 41 }])
  track.mockClear()
  update.mockClear()
  report.mockClear()
  attio.apiKey = undefined
  attio.sync.mockReset().mockResolvedValue({ status: 'skipped', reason: 'ATTIO_API_KEY is not set' })
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

describe('POST /api/contact Attio sync', () => {
  it('syncs every submission and records the Attio link on the stored row', async () => {
    attio.apiKey = 'key'
    attio.sync.mockResolvedValue({ status: 'synced', recordUrl: 'https://app.attio.com/bright-designs/deal/abc' })
    const res = await POST(request())
    expect(res.status).toBe(200)
    const [submission, deps] = attio.sync.mock.calls[0] as unknown as [Record<string, unknown>, Record<string, unknown>]
    expect(submission).toMatchObject({ kind: 'inquiry', email: 'pat@school.example', firstName: 'Pat', lastName: 'Director', submissionId: 41 })
    expect(deps).toMatchObject({ apiKey: 'key', ownerEmail: 'trevor@brightdesigns.band' })
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ attioRecordUrl: 'https://app.attio.com/bright-designs/deal/abc', attioError: null }))
  })

  it('still succeeds when Attio fails, and records and reports the error', async () => {
    attio.sync.mockResolvedValue({ status: 'failed', error: 'Attio POST /notes → 500' })
    const res = await POST(request())
    expect(res.status).toBe(200)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ attioError: 'Attio POST /notes → 500' }))
    expect(report).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ operation: 'syncSubmissionToAttio', submissionId: 41 }))
  })

  it('writes nothing back when the sync is skipped (no API key)', async () => {
    await POST(request())
    expect(update).not.toHaveBeenCalled()
  })
})
