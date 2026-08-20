import { describe, expect, it } from 'vitest'
import { tagInputSchema } from '../tags'

describe('tagInputSchema', () => {
  it('accepts a plain tag name and trims it', () => {
    expect(tagInputSchema.parse({ name: '  Brass  ' })).toEqual({ name: 'Brass' })
  })

  it('rejects an empty or whitespace-only name', () => {
    expect(tagInputSchema.safeParse({ name: '' }).success).toBe(false)
    expect(tagInputSchema.safeParse({ name: '   ' }).success).toBe(false)
  })

  it('rejects a missing name', () => {
    expect(tagInputSchema.safeParse({}).success).toBe(false)
  })

  it('strips unknown keys so they cannot reach the insert', () => {
    // The route previously passed the raw body to db.insert(tags).values(body),
    // so any column name in the payload was writable.
    const parsed = tagInputSchema.parse({ name: 'Winds', id: 999, isAdmin: true })
    expect(parsed).toEqual({ name: 'Winds' })
  })

  it('bounds the length', () => {
    expect(tagInputSchema.safeParse({ name: 'x'.repeat(101) }).success).toBe(false)
  })
})
