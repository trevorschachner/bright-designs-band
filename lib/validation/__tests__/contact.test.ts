import { describe, expect, it } from 'vitest'
import { contactSubmissionSchema } from '../contact'

const valid = { name: 'Jane Doe', email: 'jane@example.com', message: 'Hello there' }

describe('contactSubmissionSchema', () => {
  it('accepts a well-formed submission', () => {
    expect(contactSubmissionSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a malformed address before it can reach sendEmail', () => {
    // This value previously flowed straight into the `to:` field.
    for (const email of ['not-an-email', '', 'a@b', 'foo@', '@bar.com']) {
      expect(contactSubmissionSchema.safeParse({ ...valid, email }).success).toBe(false)
    }
  })

  it('rejects header-injection attempts in the address', () => {
    for (const email of ['a@b.com\nBcc: victim@x.com', 'a@b.com\r\nSubject: spam']) {
      expect(contactSubmissionSchema.safeParse({ ...valid, email }).success).toBe(false)
    }
  })

  it('allows name and message to be absent, as the resource-download flow posts', () => {
    expect(contactSubmissionSchema.safeParse({ email: 'jane@example.com' }).success).toBe(true)
    expect(contactSubmissionSchema.safeParse({ ...valid, type: 'resource_download', message: undefined }).success).toBe(true)
  })

  it('bounds field lengths', () => {
    expect(contactSubmissionSchema.safeParse({ ...valid, message: 'x'.repeat(10001) }).success).toBe(false)
    expect(contactSubmissionSchema.safeParse({ ...valid, name: 'x'.repeat(201) }).success).toBe(false)
  })

  it('keeps optional passthrough fields when present', () => {
    const parsed = contactSubmissionSchema.parse({ ...valid, type: 'resource_download', source: 'blog' })
    expect(parsed.type).toBe('resource_download')
    expect(parsed.source).toBe('blog')
  })
})

describe('scalar passthrough fields', () => {
  it('rejects a non-string phone that would otherwise reach the insert', () => {
    // POST {email, phone:{x:1}} previously threw inside the insert, was
    // swallowed, and still returned success with nothing persisted.
    expect(contactSubmissionSchema.safeParse({ ...valid, phone: { x: 1 } }).success).toBe(false)
    expect(contactSubmissionSchema.safeParse({ ...valid, school: 42 }).success).toBe(false)
  })

  it('accepts the scalar fields the handler actually reads', () => {
    const parsed = contactSubmissionSchema.parse({
      ...valid, phone: '555-0100', school: 'Rock Canyon HS', role: 'Director',
      bandSize: '80', abilityLevel: 'Advanced', referralSource: 'Google',
    })
    expect(parsed.phone).toBe('555-0100')
    expect(parsed.role).toBe('Director')
  })

  it('rejects a non-array services field', () => {
    expect(contactSubmissionSchema.safeParse({ ...valid, services: 'drill' }).success).toBe(false)
    expect(contactSubmissionSchema.safeParse({ ...valid, services: ['drill'] }).success).toBe(true)
  })
})
