import { describe, expect, it } from 'vitest'
import { resolveAuthorization } from '../authorization'

describe('resolveAuthorization', () => {
  it('reports unauthenticated when there is no email at all', () => {
    expect(resolveAuthorization(undefined, 'canManageShows')).toEqual({ status: 'unauthenticated' })
    expect(resolveAuthorization('', 'canManageShows')).toEqual({ status: 'unauthenticated' })
  })

  it('distinguishes forbidden from unauthenticated for a signed-in non-staff user', () => {
    // The bug this guards: routes previously treated "has a session" as
    // sufficient, so any signed-up account could edit the catalogue.
    expect(resolveAuthorization('guest@example.com', 'canManageShows')).toEqual({
      status: 'forbidden',
      email: 'guest@example.com',
    })
  })

  it('authorizes staff for the permissions they hold', () => {
    expect(resolveAuthorization('designer@brightdesigns.band', 'canManageShows')).toEqual({
      status: 'authorized',
      email: 'designer@brightdesigns.band',
    })
  })

  it('still refuses staff a permission they do not hold', () => {
    // canManageUsers is admin-only; staff holding every other permission is
    // what makes this worth asserting.
    expect(resolveAuthorization('designer@brightdesigns.band', 'canManageUsers')).toEqual({
      status: 'forbidden',
      email: 'designer@brightdesigns.band',
    })
  })

  it('does not let a lookalike domain pass as staff', () => {
    for (const email of [
      'attacker@notbrightdesigns.band.example.com',
      'attacker@brightdesigns.band.evil.com',
      'brightdesigns.band@example.com',
    ]) {
      expect(resolveAuthorization(email, 'canManageShows').status).toBe('forbidden')
    }
  })
})
