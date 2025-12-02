import { describe, it, expect } from 'vitest'

import { 
  ROLE_PERMISSIONS, 
  getUserPermissions, 
  hasPermission, 
  requirePermission 
} from '@/lib/auth/roles'

describe('ROLE_PERMISSIONS', () => {
  it('grants canDeleteFiles to admin and staff but not users', () => {
    expect(ROLE_PERMISSIONS.admin.canDeleteFiles).toBe(true)
    expect(ROLE_PERMISSIONS.staff.canDeleteFiles).toBe(true)
    expect(ROLE_PERMISSIONS.user.canDeleteFiles).toBe(false)
  })
})

describe('getUserPermissions', () => {
  it('treats @brightdesigns.band emails as staff with file delete rights', () => {
    const permissions = getUserPermissions('designer@brightdesigns.band')
    expect(permissions.canDeleteFiles).toBe(true)
    expect(permissions.canDeleteArrangements).toBe(false)
  })

  it('treats other emails as regular users without file delete rights', () => {
    const permissions = getUserPermissions('guest@example.com')
    expect(permissions.canDeleteFiles).toBe(false)
    expect(permissions.canUploadFiles).toBe(false)
  })
})

describe('permission helpers', () => {
  it('hasPermission reflects the underlying permission map', () => {
    expect(hasPermission('designer@brightdesigns.band', 'canDeleteFiles')).toBe(true)
    expect(hasPermission('guest@example.com', 'canDeleteFiles')).toBe(false)
  })

  it('requirePermission guards against missing emails', () => {
    expect(requirePermission(undefined, 'canDeleteFiles')).toBe(false)
    expect(requirePermission('', 'canDeleteFiles')).toBe(false)
  })
})

