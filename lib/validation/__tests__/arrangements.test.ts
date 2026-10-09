import { describe, expect, it } from 'vitest'
import { arrangementSlugSchema } from '@/lib/validation/arrangements'

describe('arrangementSlugSchema', () => {
  it('accepts lowercase hyphenated words', () => {
    expect(arrangementSlugSchema.safeParse('pipeline-2').success).toBe(true)
  })
  it('rejects all-digit slugs, which the route reads as ids', () => {
    const r = arrangementSlugSchema.safeParse('5')
    expect(r.success).toBe(false)
    expect(JSON.stringify(r.error?.issues)).toContain('Slug cannot be all digits')
  })
  it('rejects uppercase and stray hyphens', () => {
    expect(arrangementSlugSchema.safeParse('Pipeline').success).toBe(false)
    expect(arrangementSlugSchema.safeParse('a--b').success).toBe(false)
  })
})
