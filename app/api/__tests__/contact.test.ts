import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * POST /api/contact: Turnstile and a per-IP rate limit gate the route before
 * anything is stored or emailed, the token never reaches the database, and the
 * confirmation sent to the submitted address carries none of their message.
 */

let turnstileResult = true
let rateLimitResult = { allowed: true, remaining: 4, retryAfterSeconds: 120 }
const verifyCalls: { token: string; ip?: string }[] = []
const consumeCalls: string[] = []
const inserted: Record<string, unknown>[] = []
const sent: { to: string | string[]; subject: string; html: string; text?: string }[] = []

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: async (token: string, ip?: string) => {
    verifyCalls.push({ token, ip })
    return turnstileResult
  },
}))

vi.mock('@/lib/rate-limit', async (orig) => {
  const actual = await orig<typeof import('@/lib/rate-limit')>()
  return {
    ...actual,
    consume: async (ip: string) => {
      consumeCalls.push(ip)
      return rateLimitResult
    },
  }
})

vi.mock('@/lib/email/service', () => ({
  sendEmail: async (payload: (typeof sent)[number]) => {
    sent.push(payload)
    return { success: true, messageId: 'm1' }
  },
}))

vi.mock('@/lib/database', () => ({
  db: {
    insert: () => ({
      values: async (row: Record<string, unknown>) => {
        inserted.push(row)
      },
    }),
  },
}))

const MESSAGE = 'Please quote us for drill. UNIQUE-MESSAGE-TEXT-42'

const validBody = {
  type: 'inquiry',
  source: 'contact',
  name: 'Jane Doe',
  email: 'jane@example.com',
  school: 'Rock Canyon HS',
  showInterest: 'Starlight',
  services: ['drill'],
  message: MESSAGE,
  turnstileToken: 'tok-123',
}

const post = async (body: unknown, headers: Record<string, string> = {}) => {
  const { POST } = await import('@/app/api/contact/route')
  return POST(
    new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }) as never
  )
}

beforeEach(() => {
  turnstileResult = true
  rateLimitResult = { allowed: true, remaining: 4, retryAfterSeconds: 120 }
  verifyCalls.length = 0
  consumeCalls.length = 0
  inserted.length = 0
  sent.length = 0
})

describe('POST /api/contact', () => {
  it('rejects a submission without a Turnstile token before doing anything', async () => {
    const { turnstileToken: _omit, ...withoutToken } = validBody
    const res = await post(withoutToken)
    expect(res.status).toBe(400)
    expect(consumeCalls).toHaveLength(0)
    expect(verifyCalls).toHaveLength(0)
    expect(inserted).toHaveLength(0)
    expect(sent).toHaveLength(0)
  })

  it('rejects malformed JSON with a generic 400', async () => {
    const res = await post('{not json')
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Bad request' })
  })

  it('returns a generic 400 when Turnstile rejects the token', async () => {
    turnstileResult = false
    const res = await post(validBody, { 'x-nf-client-connection-ip': '203.0.113.9' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Verification failed' })
    expect(verifyCalls).toEqual([{ token: 'tok-123', ip: '203.0.113.9' }])
    expect(inserted).toHaveLength(0)
    expect(sent).toHaveLength(0)
  })

  it('returns 429 with Retry-After when the rate limit is exceeded, before Turnstile', async () => {
    rateLimitResult = { allowed: false, remaining: 0, retryAfterSeconds: 321 }
    const res = await post(validBody)
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('321')
    expect(verifyCalls).toHaveLength(0)
    expect(inserted).toHaveLength(0)
    expect(sent).toHaveLength(0)
  })

  it('keys the rate limit on the Netlify client IP, then x-forwarded-for', async () => {
    await post(validBody, {
      'x-nf-client-connection-ip': '198.51.100.1',
      'x-forwarded-for': '10.0.0.1, 10.0.0.2',
    })
    await post(validBody, { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' })
    await post(validBody)
    expect(consumeCalls).toEqual(['198.51.100.1', '10.0.0.1', 'unknown'])
  })

  it('stores and emails a valid submission without the token', async () => {
    const res = await post(validBody, { 'x-nf-client-connection-ip': '203.0.113.9' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })

    expect(inserted).toHaveLength(1)
    const row = inserted[0]
    expect(row).not.toHaveProperty('turnstileToken')
    expect(JSON.stringify(row)).not.toContain('tok-123')
    expect(row.ipAddress).toBe('203.0.113.9')
    expect(row.message).toBe(MESSAGE)

    for (const email of sent) {
      expect(`${email.html}${email.text}`).not.toContain('tok-123')
    }
  })

  it('keeps the message in the staff notification but not in the confirmation', async () => {
    await post(validBody)
    expect(sent).toHaveLength(2)

    const staff = sent.find((e) => e.to !== 'jane@example.com')!
    const confirmation = sent.find((e) => e.to === 'jane@example.com')!
    expect(staff.html).toContain('UNIQUE-MESSAGE-TEXT-42')
    expect(confirmation.html).not.toContain('UNIQUE-MESSAGE-TEXT-42')
    expect(confirmation.text).not.toContain('UNIQUE-MESSAGE-TEXT-42')
    expect(confirmation.html).not.toContain('Rock Canyon HS')
    expect(confirmation.html).not.toContain('Starlight')
    expect(confirmation.text).toContain('your show inquiry')
  })

  it('applies the same rule to the general-contact branch', async () => {
    await post({ ...validBody, type: 'contact' })
    const confirmation = sent.find((e) => e.to === 'jane@example.com')!
    expect(confirmation.html).not.toContain('UNIQUE-MESSAGE-TEXT-42')
    expect(confirmation.text).not.toContain('UNIQUE-MESSAGE-TEXT-42')
    expect(confirmation.text).toContain('your message')
  })

  it('does not put a URL-bearing topic or name into the confirmation', async () => {
    await post({
      ...validBody,
      name: 'https://evil.example/x Smith',
      showInterest: 'Claim your prize at evil.example/x',
    })
    const confirmation = sent.find((e) => e.to === 'jane@example.com')!
    expect(confirmation.html).not.toContain('evil.example')
    expect(confirmation.text).not.toContain('evil.example')
    expect(confirmation.text).not.toContain('Claim your prize')
  })

  it('never returns the internal error message', async () => {
    const service = await import('@/lib/email/service')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(service, 'sendEmail').mockResolvedValueOnce({ success: false, error: 'SMTP secret detail' })
    const res = await post(validBody)
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('SMTP secret detail')
    spy.mockRestore()
  })
})
