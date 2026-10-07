import { describe, expect, it } from 'vitest'
import { safeNext } from '../safe-next'

describe('safeNext', () => {
  it.each([
    [null, '/admin'],
    ['', '/admin'],
    ['/admin/shows', '/admin/shows'],
    ['//evil.com', '/admin'],
    ['/\\evil', '/admin'],
    ['https://x', '/admin'],
    ['/a b', '/admin'],
  ])('safeNext(%j) -> %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected)
  })
})
