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
