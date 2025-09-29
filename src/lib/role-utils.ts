import { UserRole } from '@prisma/client'

/**
 * Role definitions with Turkish labels and descriptions
 */
export const ROLE_DEFINITIONS = {
  [UserRole.MEMBER]: {
    label: 'Üye',
    description: 'Sadece içerik görüntüleme ve yorum ekleme yetkisi',
    color: 'bg-gray-100 text-gray-800',
    permissions: [
      'İçerikleri görüntüleme',
      'Yorum ekleme',
      'Arama yapma'
    ]
  },
  [UserRole.EDITOR]: {
    label: 'Editör',
    description: 'İçerik oluşturma ve düzenleme yetkisi',
    color: 'bg-blue-100 text-blue-800',
    permissions: [
      'Tüm üye yetkileri',
      'İçerik oluşturma',
      'İçerik düzenleme',
      'Dosya yükleme',
      'Etiket yönetimi'
    ]
  },
  [UserRole.ADMIN]: {
    label: 'Yönetici',
    description: 'Kullanıcı yönetimi ve tüm içerik yetkileri',
    color: 'bg-green-100 text-green-800',
    permissions: [
      'Tüm editör yetkileri',
      'Kullanıcı ekleme/silme',
      'Rol atama (Editör/Üye)',
      'Aktivite logları görüntüleme',
      'Yorum yönetimi'
    ]
  },
  [UserRole.SYSTEM_ADMIN]: {
    label: 'Sistem Yöneticisi',
    description: 'Tam sistem erişimi ve teknik yönetim yetkisi',
    color: 'bg-red-100 text-red-800',
    permissions: [
      'Tüm yönetici yetkileri',
      'Sistem Yöneticisi rolü atama',
      'Sistem ayarları',
      'Teknik konfigürasyon',
      'Veritabanı yönetimi'
    ]
  }
} as const

/**
 * Get role definition by role value
 */
export function getRoleDefinition(role: UserRole) {
  return ROLE_DEFINITIONS[role]
}

/**
 * Get all available roles as array
 */
export function getAllRoles() {
  return Object.entries(ROLE_DEFINITIONS).map(([value, definition]) => ({
    value: value as UserRole,
    ...definition
  }))
}

/**
 * Get roles that a user can assign based on their current role
 */
export function getAssignableRoles(currentUserRole: UserRole) {
  const allRoles = getAllRoles()
  
  switch (currentUserRole) {
    case UserRole.SYSTEM_ADMIN:
      return allRoles // Can assign any role
    case UserRole.ADMIN:
      return allRoles.filter(role => role.value !== UserRole.SYSTEM_ADMIN)
    default:
      return [] // Other roles cannot assign roles
  }
}

/**
 * Check if role change is allowed
 */
export function isRoleChangeAllowed(
  currentUserRole: UserRole,
  targetCurrentRole: UserRole,
  newRole: UserRole
): boolean {
  // Cannot change own role
  if (currentUserRole === targetCurrentRole) {
    return false
  }

  // Only SYSTEM_ADMIN can assign SYSTEM_ADMIN role
  if (newRole === UserRole.SYSTEM_ADMIN && currentUserRole !== UserRole.SYSTEM_ADMIN) {
    return false
  }

  // SYSTEM_ADMIN can change any role (except their own)
  if (currentUserRole === UserRole.SYSTEM_ADMIN) {
    return true
  }

  // ADMIN can change EDITOR and MEMBER roles
  if (currentUserRole === UserRole.ADMIN) {
    const allowedRoles: UserRole[] = [UserRole.EDITOR, UserRole.MEMBER]
    return allowedRoles.includes(newRole) && allowedRoles.includes(targetCurrentRole)
  }

  return false
}

/**
 * Get role badge class for UI
 */
export function getRoleBadgeClass(role: UserRole): string {
  return getRoleDefinition(role).color
}

/**
 * Sort roles by hierarchy (highest first)
 */
export function sortRolesByHierarchy(roles: UserRole[]): UserRole[] {
  const hierarchy = [
    UserRole.SYSTEM_ADMIN,
    UserRole.ADMIN,
    UserRole.EDITOR,
    UserRole.MEMBER
  ]
  
  return roles.sort((a, b) => hierarchy.indexOf(a) - hierarchy.indexOf(b))
}

/**
 * Format role for display
 */
export function formatRole(role: UserRole): string {
  return getRoleDefinition(role).label
}