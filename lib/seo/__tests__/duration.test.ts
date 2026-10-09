import { describe, expect, it } from 'vitest'
import { isoDuration } from '@/lib/seo/duration'
describe('isoDuration', () => {
  it.each([
    ['7:30', 'PT7M30S'], ['7:30 min', 'PT7M30S'], ['8 min', 'PT8M'], ['8', 'PT8M'], ['5:48', 'PT5M48S'],
    ['', null], [null, null], [undefined, null], ['abc', null], ['7:xx', null],
  ])('%s → %s', (input, expected) => { expect(isoDuration(input as string | null | undefined)).toBe(expected) })
})
