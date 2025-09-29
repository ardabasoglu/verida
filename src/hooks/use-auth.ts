'use client'

import { useSession } from 'next-auth/react'
import { UserRole } from '@prisma/client'

export function useAuth() {
  const { data: session, status } = useSession()

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const user = session?.user

  return {
    user,
    isLoading,
    isAuthenticated,
    session,
  }
}

export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return { user: null, isLoading: true, isAuthenticated: false }
  }

  if (!isAuthenticated || !user) {
    throw new Error('Authentication required')
  }

  return { user, isLoading: false, isAuthenticated: true }
}

export function useRole() {
  const { user } = useAuth()
  
  const hasRole = (requiredRoles: UserRole[]) => {
    if (!user?.role) return false
    return requiredRoles.includes(user.role)
  }

  const isAdmin = () => hasRole([UserRole.SYSTEM_ADMIN, UserRole.ADMIN])
  const canEditContent = () => hasRole([UserRole.SYSTEM_ADMIN, UserRole.ADMIN, UserRole.EDITOR])
  const isSystemAdmin = () => hasRole([UserRole.SYSTEM_ADMIN])

  return {
    role: user?.role,
    hasRole,
    isAdmin,
    canEditContent,
    isSystemAdmin,
  }
}