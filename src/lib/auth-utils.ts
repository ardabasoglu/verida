import { UserRole } from '@prisma/client';
import { Session } from 'next-auth';

/**
 * Check if user has required role(s)
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Check if user is admin (ADMIN or SYSTEM_ADMIN)
 */
export function isAdmin(userRole: UserRole): boolean {
  return hasRole(userRole, ['ADMIN', 'SYSTEM_ADMIN']);
}

/**
 * Check if user is system admin
 */
export function isSystemAdmin(userRole: UserRole): boolean {
  return userRole === 'SYSTEM_ADMIN';
}

/**
 * Check if user can access admin routes
 */
export function canAccessAdminRoutes(session: Session | null): boolean {
  if (!session?.user) return false;
  return isAdmin(session.user.role);
}

/**
 * Check if user can access pages management
 */
export function canAccessPagesManagement(session: Session | null): boolean {
  if (!session?.user) return false;
  return hasRole(session.user.role, ['ADMIN', 'SYSTEM_ADMIN']);
}

/**
 * Check if user can edit content
 */
export function canEditContent(session: Session | null): boolean {
  if (!session?.user) return false;
  return hasRole(session.user.role, ['ADMIN', 'SYSTEM_ADMIN', 'EDITOR']);
}

/**
 * Check if user can manage users
 */
export function canManageUsers(session: Session | null): boolean {
  if (!session?.user) return false;
  return hasRole(session.user.role, ['SYSTEM_ADMIN']);
}

/**
 * Check if user can access unread pages
 */
export function canAccessUnreadPages(session: Session | null): boolean {
  if (!session?.user) return false;
  return hasRole(session.user.role, ['ADMIN', 'SYSTEM_ADMIN', 'EDITOR', 'MEMBER']);
}

/**
 * Check if user can view published pages (read-only access)
 */
export function canViewPublishedPages(session: Session | null): boolean {
  if (!session?.user) return false;
  return hasRole(session.user.role, ['ADMIN', 'SYSTEM_ADMIN', 'EDITOR', 'MEMBER']);
}