import { describe, expect, it } from 'vitest'
import { isIndexableArrangement, MIN_ARRANGEMENT_WORDS } from '@/lib/seo/indexable'
describe('isIndexableArrangement', () => {
  it('needs at least 120 words', () => {
    expect(MIN_ARRANGEMENT_WORDS).toBe(120)
    expect(isIndexableArrangement(null)).toBe(false)
    expect(isIndexableArrangement('short text')).toBe(false)
    expect(isIndexableArrangement(Array(120).fill('word').join(' '))).toBe(true)
  })
})
