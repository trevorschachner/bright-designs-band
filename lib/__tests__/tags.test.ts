import { describe, it, expect } from 'vitest'
import { displayTagName } from '@/lib/tags'

describe('displayTagName', () => {
  it('strips the Theme: prefix', () => expect(displayTagName('Theme: Dark')).toBe('Dark'))
  it('leaves other names alone', () => {
    expect(displayTagName('Small Band')).toBe('Small Band')
    expect(displayTagName('A Theme: B')).toBe('A Theme: B')
  })
})
