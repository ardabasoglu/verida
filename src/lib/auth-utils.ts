import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { redirect } from 'next/navigation'

/**
 * Get the current session on the server side
 */
export async function getCurrentSession() {
    return await getServerSession(authOptions)
}

/**
 * Get the current user or redirect to signin
 */
export async function getCurrentUser() {
    const session = await getCurrentSession()

    if (!session?.user) {
        redirect('/auth/signin')
    }

    return session.user
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole)
}

/**
 * Check if user is admin (SYSTEM_ADMIN or ADMIN)
 */
export function isAdmin(userRole: UserRole): boolean {
    return hasRole(userRole, [UserRole.SYSTEM_ADMIN, UserRole.ADMIN])
}

/**
 * Check if user can edit content (SYSTEM_ADMIN, ADMIN, or EDITOR)
 */
export function canEditContent(userRole: UserRole): boolean {
    return hasRole(userRole, [UserRole.SYSTEM_ADMIN, UserRole.ADMIN, UserRole.EDITOR])
}

/**
 * Require specific role or redirect
 */
export async function requireRole(requiredRoles: UserRole[]) {
    const user = await getCurrentUser()

    if (!hasRole(user.role, requiredRoles)) {
        redirect('/unauthorized')
    }

    return user
}

/**
 * Require admin role or redirect
 */
export async function requireAdmin() {
    return await requireRole([UserRole.SYSTEM_ADMIN, UserRole.ADMIN])
}

/**
 * Require editor role or redirect
 */
export async function requireEditor() {
    return await requireRole([UserRole.SYSTEM_ADMIN, UserRole.ADMIN, UserRole.EDITOR])
}

/**
 * Validate email domain
 */
export function isValidEmailDomain(email: string): boolean {
    return email.endsWith('@dgmgumruk.com')
}

/**
 * Check if user can manage users (SYSTEM_ADMIN or ADMIN)
 */
export function canManageUsers(userRole: UserRole): boolean {
    return hasRole(userRole, [UserRole.SYSTEM_ADMIN, UserRole.ADMIN])
}

/**
 * Check if user can assign specific role
 */
export function canAssignRole(currentUserRole: UserRole, targetRole: UserRole): boolean {
    // Only SYSTEM_ADMIN can assign SYSTEM_ADMIN role
    if (targetRole === UserRole.SYSTEM_ADMIN) {
        return currentUserRole === UserRole.SYSTEM_ADMIN
    }

    // SYSTEM_ADMIN and ADMIN can assign other roles
    return canManageUsers(currentUserRole)
}

/**
 * Check if user can delete another user
 */
export function canDeleteUser(currentUserRole: UserRole, targetUserRole: UserRole): boolean {
    // SYSTEM_ADMIN can delete anyone except other SYSTEM_ADMINs
    if (currentUserRole === UserRole.SYSTEM_ADMIN) {
        return targetUserRole !== UserRole.SYSTEM_ADMIN
    }

    // ADMIN can delete EDITOR and MEMBER
    if (currentUserRole === UserRole.ADMIN) {
        return hasRole(targetUserRole, [UserRole.EDITOR, UserRole.MEMBER])
    }

    return false
}

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: UserRole): number {
    switch (role) {
        case UserRole.MEMBER:
            return 1
        case UserRole.EDITOR:
            return 2
        case UserRole.ADMIN:
            return 3
        case UserRole.SYSTEM_ADMIN:
            return 4
        default:
            return 0
    }
}

/**
 * Check if current user has higher or equal role than target user
 */
export function hasHigherOrEqualRole(currentUserRole: UserRole, targetUserRole: UserRole): boolean {
    return getRoleLevel(currentUserRole) >= getRoleLevel(targetUserRole)
}