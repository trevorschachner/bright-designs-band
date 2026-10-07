import { describe, expect, it } from 'vitest'
import { resolveAuthorization } from '../authorization'
import { ROLE_PERMISSIONS, NO_PERMISSIONS, type Permission } from '../permissions'

const ALL = Object.keys(ROLE_PERMISSIONS.owner) as Permission[]
const CONTENT = ALL.filter((p) => p !== 'canManageUsers')

describe('resolveAuthorization', () => {
  it('reports unauthenticated when there is no email at all', () => {
    expect(resolveAuthorization(undefined, null, 'canManageShows')).toEqual({ status: 'unauthenticated' })
    expect(resolveAuthorization('', 'owner', 'canManageShows')).toEqual({ status: 'unauthenticated' })
  })

  it('gives a signed-in address with no role nothing', () => {
    // The bug this guards: routes previously treated "has a session" as
    // sufficient, so any signed-up account could edit the catalogue.
    for (const permission of ALL) {
      expect(resolveAuthorization('guest@example.com', null, permission)).toEqual({
        status: 'forbidden',
        email: 'guest@example.com',
      })
    }
  })

  it('does not treat a domain address as staff without a role', () => {
    expect(resolveAuthorization('designer@brightdesigns.band', null, 'canAccessAdmin').status).toBe('forbidden')
  })

  it('authorizes an editor for every content permission but not canManageUsers', () => {
    for (const permission of CONTENT) {
      expect(resolveAuthorization('e@example.com', 'editor', permission)).toEqual({
        status: 'authorized',
        email: 'e@example.com',
        role: 'editor',
      })
    }
    expect(resolveAuthorization('e@example.com', 'editor', 'canManageUsers')).toEqual({
      status: 'forbidden',
      email: 'e@example.com',
    })
  })

  it('authorizes an owner for everything, including canManageUsers', () => {
    for (const permission of ALL) {
      expect(resolveAuthorization('o@example.com', 'owner', permission).status).toBe('authorized')
    }
  })
})

describe('ROLE_PERMISSIONS', () => {
  it('owner = editor + canManageUsers', () => {
    expect(ROLE_PERMISSIONS.owner).toEqual({ ...ROLE_PERMISSIONS.editor, canManageUsers: true })
    expect(ROLE_PERMISSIONS.editor.canManageUsers).toBe(false)
  })

  it('no role means every permission is false', () => {
    expect(Object.values(NO_PERMISSIONS).every((v) => v === false)).toBe(true)
    expect(Object.keys(NO_PERMISSIONS).sort()).toEqual([...ALL].sort())
  })
})
