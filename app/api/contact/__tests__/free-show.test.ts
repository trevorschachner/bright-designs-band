import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const insert = vi.hoisted(() => vi.fn((_row: unknown) => Promise.resolve([{ id: 7 }])))
const sent = vi.hoisted(() => [] as Array<{ to: string | string[]; subject: string; html: string; text?: string }>)
const attioSync = vi.hoisted(() => vi.fn(async (_submission: unknown) => ({ status: 'skipped', reason: 'no key' })))
vi.mock('@/lib/database', () => ({
  db: {
    insert: () => ({ values: (row: unknown) => ({ returning: () => insert(row) }) }),
    update: () => ({ set: () => ({ where: async () => {} }) }),
  },
}))
vi.mock('@/lib/database/schema', () => ({ contactSubmissions: { id: 'id' } }))
vi.mock('@/lib/integrations/attio', () => ({ syncSubmissionToAttio: attioSync }))
vi.mock('@/lib/observability/report-error', () => ({ reportError: async () => {} }))
vi.mock('@/lib/email/service', () => ({
  sendEmail: async (payload: (typeof sent)[number]) => {
    sent.push(payload)
    return { success: true }
  },
}))
vi.mock('@/lib/rate-limit', () => ({ consume: async () => ({ allowed: true }), getClientIp: () => '1.2.3.4' }))
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: async () => true }))
vi.mock('@/lib/env.server', () => ({ getEnv: () => ({ ADMIN_EMAIL: 'admin@example.com' }) }))
vi.mock('@/lib/observability/events', () => ({ trackServerEvent: async () => {} }))

import { POST } from '../route'

const signUp = {
  type: 'free_show_signup',
  source: 'indoor-winds-2027',
  name: 'Pat Director',
  email: 'pat@school.example',
  school: 'Anytown Winds',
  location: 'Greenville, SC',
  bandSize: '20-35',
  programBenefit: 'BENEFIT-TEXT-1',
  recentChallenges: 'CHALLENGE-TEXT-2',
  usedDesignGroup: 'yes',
  previousDesignGroup: 'Some Design Co',
  turnstileToken: 'tok',
}

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }) as never
  )

// Inside the entry window unless a test moves the clock.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-15T12:00:00Z'))
  insert.mockClear()
  attioSync.mockClear()
  sent.length = 0
})

afterEach(() => {
  vi.useRealTimers()
})

describe('POST /api/contact free show sign-up', () => {
  it('stores the answers in the message, tagged with the program', async () => {
    const res = await post(signUp)
    expect(res.status).toBe(200)
    const row = insert.mock.calls[0][0] as Record<string, string>
    expect(row.service).toBe('2027 Indoor Winds Free Show')
    expect(row.source).toBe('indoor-winds-2027')
    expect(row.school).toBe('Anytown Winds')
    expect(row.message).toContain('Location:\nGreenville, SC')
    expect(row.message).toContain('BENEFIT-TEXT-1')
    expect(row.message).toContain('CHALLENGE-TEXT-2')
    expect(row.message).toContain('Used a design group before?:\nYes (Some Design Co)')
  })

  it('emails staff the answers and the submitter a confirmation without them', async () => {
    await post(signUp)
    expect(sent).toHaveLength(2)
    const staff = sent.find((e) => e.to !== 'pat@school.example')!
    const confirmation = sent.find((e) => e.to === 'pat@school.example')!
    expect(staff.subject).toBe('2027 Indoor Winds Free Show entry from Pat Director')
    expect(staff.html).toContain('BENEFIT-TEXT-1')
    expect(staff.html).toContain('20-35')
    expect(confirmation.subject).toBe("You're entered: 2027 Indoor Winds Giveaway | Bright Designs Band")
    expect(confirmation.text).toContain("We've received your 2027 Indoor Winds Giveaway entry. You're entered.")
    expect(confirmation.text).not.toContain('24 hours')
    expect(`${confirmation.html}${confirmation.text}`).not.toContain('BENEFIT-TEXT-1')
    expect(`${confirmation.html}${confirmation.text}`).not.toContain('Anytown Winds')
  })

  it('syncs the answers to Attio', async () => {
    await post(signUp)
    expect(attioSync.mock.calls[0][0]).toMatchObject({
      showInterest: '2027 Indoor Winds Free Show',
      message: expect.stringContaining('CHALLENGE-TEXT-2'),
    })
  })

  it('rejects entries after the deadline without storing or emailing them', async () => {
    vi.setSystemTime(new Date('2026-12-01T05:00:00Z'))
    const res = await post(signUp)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Entries are closed' })
    expect(insert).not.toHaveBeenCalled()
    expect(sent).toHaveLength(0)
  })

  it('rejects an unknown design-group answer', async () => {
    const res = await post({ ...signUp, usedDesignGroup: 'maybe' })
    expect(res.status).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })
})
