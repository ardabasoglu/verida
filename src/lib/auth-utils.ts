import { UserRole } from '@prisma/client';
import { Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  return await getServerSession(authOptions);
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session?.user?.id) return null;
  
  return await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Require admin role - throws error if not admin
 */
export async function requireAdmin() {
  const session = await getCurrentSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  
  if (!isAdmin(session.user.role)) {
    throw new Error('Admin access required');
  }
  
  return session.user;
}

/**
 * Get role hierarchy level (higher number = higher role)
 */
export function getRoleLevel(role: UserRole): number {
  switch (role) {
    case 'MEMBER':
      return 1;
    case 'EDITOR':
      return 2;
    case 'ADMIN':
      return 3;
    case 'SYSTEM_ADMIN':
      return 4;
    default:
      return 0;
  }
}

/**
 * Check if user has higher or equal role level
 */
export function hasHigherOrEqualRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

/**
 * Check if user can assign a specific role
 */
export function canAssignRole(currentUserRole: UserRole, targetRole: UserRole): boolean {
  // Only admins and system admins can assign roles
  if (!isAdmin(currentUserRole)) {
    return false;
  }
  
  // System admin can assign any role
  if (currentUserRole === 'SYSTEM_ADMIN') {
    return true;
  }
  
  // Admin can assign MEMBER and EDITOR roles only
  if (currentUserRole === 'ADMIN') {
    return targetRole === 'MEMBER' || targetRole === 'EDITOR';
  }
  
  return false;
}

/**
 * Check if user can delete another user
 */
export function canDeleteUser(currentUserRole: UserRole, targetUserRole: UserRole): boolean {
  // Only system admin can delete users
  if (currentUserRole !== 'SYSTEM_ADMIN') {
    return false;
  }
  
  // System admin can delete any user except other system admins
  return targetUserRole !== 'SYSTEM_ADMIN';
}