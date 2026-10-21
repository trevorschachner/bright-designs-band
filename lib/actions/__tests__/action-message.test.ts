import { describe, it, expect } from 'vitest'
import { actionMessage } from '@/lib/actions/result'

describe('actionMessage', () => {
  it('shows every author-written issue, joined', () => {
    expect(actionMessage({ ok: false, error: 'invalid', issues: [{ path: 'a', message: 'One' }, { path: 'b', message: 'Two' }] })).toBe('One; Two')
  })
  it('uses the screen wording, else the default', () => {
    expect(actionMessage({ ok: false, error: 'not_found' }, { not_found: 'That tag was already deleted.' })).toBe('That tag was already deleted.')
    expect(actionMessage({ ok: false, error: 'failed' }, { not_found: 'x' })).toBe('Something went wrong. Try again.')
  })
})
