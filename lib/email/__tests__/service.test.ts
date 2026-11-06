import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/env.server', () => ({ getEnv: () => ({}) }))

import { formatFrom } from '../service'

describe('formatFrom', () => {
  it('shows Bright Designs as the sender name', () => {
    expect(formatFrom(undefined)).toBe('Bright Designs <hello@transactional.brightdesigns.band>')
    expect(formatFrom('')).toBe('Bright Designs <hello@transactional.brightdesigns.band>')
    expect(formatFrom('team@brightdesigns.band')).toBe('Bright Designs <team@brightdesigns.band>')
  })

  it('keeps an EMAIL_FROM that already names the sender', () => {
    expect(formatFrom('Someone Else <a@b.example>')).toBe('Someone Else <a@b.example>')
  })
})
