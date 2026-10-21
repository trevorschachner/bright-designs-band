import { describe, it, expect } from 'vitest'
import { escapeLike, likePattern } from '@/lib/filters/admin-search'

describe('escapeLike', () => {
  it('escapes %, _ and backslash so they match literally', () => {
    expect(escapeLike('100%_a\\b')).toBe('100\\%\\_a\\\\b')
    expect(likePattern('50%')).toBe('%50\\%%')
  })
})
