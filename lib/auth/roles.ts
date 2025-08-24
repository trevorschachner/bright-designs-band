export type UserRole = 'admin' | 'staff' | 'user'

export interface UserPermissions {
  canAccessAdmin: boolean
  canManageShows: boolean
  canManageTags: boolean
  canManageUsers: boolean
  canViewAnalytics: boolean
  canCreateArrangements: boolean
  canEditArrangements: boolean
  canDeleteArrangements: boolean
  canUploadFiles: boolean
}

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canAccessAdmin: true,
    canManageShows: true,
    canManageTags: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canCreateArrangements: true,
    canEditArrangements: true,
    canDeleteArrangements: true,
    canUploadFiles: true,
  },
  staff: {
    canAccessAdmin: true,
    canManageShows: true,
    canManageTags: true,
    canManageUsers: false,
    canViewAnalytics: true,
    canCreateArrangements: true,
    canEditArrangements: true,
    canDeleteArrangements: false,
    canUploadFiles: true,
  },
  user: {
    canAccessAdmin: false,
    canManageShows: false,
    canManageTags: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canCreateArrangements: false,
    canEditArrangements: false,
    canDeleteArrangements: false,
    canUploadFiles: false,
  },
}

export function getUserRole(email: string): UserRole {
  if (!email) return 'user'
  
  // Staff members have @brightdesigns.band emails
  if (email.endsWith('@brightdesigns.band')) {
    return 'staff'
  }
  
  // You can add specific admin emails here if needed
  const adminEmails: string[] = [
    // Add specific admin emails here if you want to override the domain rule
    // 'admin@example.com'
  ]
  
  if (adminEmails.includes(email.toLowerCase())) {
    return 'admin'
  }
  
  // Everyone else is a regular user
  return 'user'
}

export function getUserPermissions(email: string): UserPermissions {
  const role = getUserRole(email)
  return ROLE_PERMISSIONS[role]
}

export function hasPermission(email: string, permission: keyof UserPermissions): boolean {
  const permissions = getUserPermissions(email)
  return permissions[permission]
}

export function requirePermission(email: string | undefined, permission: keyof UserPermissions): boolean {
  if (!email) return false
  return hasPermission(email, permission)
}

export function requireRole(email: string | undefined, requiredRole: UserRole): boolean {
  if (!email) return false
  const userRole = getUserRole(email)
  
  // Define role hierarchy: admin > staff > user
  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    staff: 2,
    user: 1,
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
} 