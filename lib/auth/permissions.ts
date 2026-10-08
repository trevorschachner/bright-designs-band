/**
 * What each admin role may do. Pure: no I/O, safe to import anywhere.
 *
 * A role comes from a row in `admin_users` (see ./roles.ts). No row means no
 * role, and no role means no permissions at all.
 */
export const ADMIN_ROLES = ['owner', 'editor'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

export interface UserPermissions {
  canAccessAdmin: boolean
  canManageShows: boolean
  canManageTags: boolean
  canManageResources: boolean
  canManageUsers: boolean
  canViewAnalytics: boolean
  canCreateArrangements: boolean
  canEditArrangements: boolean
  canDeleteArrangements: boolean
  canUploadFiles: boolean
  canDeleteFiles: boolean
}

export type Permission = keyof UserPermissions

const EDITOR: UserPermissions = {
  canAccessAdmin: true,
  canManageShows: true,
  canManageTags: true,
  canManageResources: true,
  canManageUsers: false,
  canViewAnalytics: true,
  canCreateArrangements: true,
  canEditArrangements: true,
  canDeleteArrangements: true,
  canUploadFiles: true,
  canDeleteFiles: true,
}

export const NO_PERMISSIONS: UserPermissions = Object.freeze(
  Object.fromEntries(Object.keys(EDITOR).map((key) => [key, false])) as unknown as UserPermissions
)

/** editor = every content permission; owner = editor + managing admin users. */
export const ROLE_PERMISSIONS: Record<AdminRole, UserPermissions> = {
  editor: EDITOR,
  owner: { ...EDITOR, canManageUsers: true },
}

export function permissionsFor(role: AdminRole | null | undefined): UserPermissions {
  return role ? ROLE_PERMISSIONS[role] : NO_PERMISSIONS
}

export function roleHasPermission(role: AdminRole | null | undefined, permission: Permission): boolean {
  return permissionsFor(role)[permission]
}

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && (ADMIN_ROLES as readonly string[]).includes(value)
}
