'use client'

import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@prisma/client'
import { ReactNode } from 'react'
import Link from 'next/link'

interface AuthGuardProps {
  children: ReactNode
  requiredRoles?: UserRole[]
  fallback?: ReactNode
}

export function AuthGuard({ children, requiredRoles, fallback }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-muted">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Giriş yapmanız gerekiyor
            </h2>
            <p className="text-muted-foreground mb-8">
              Bu sayfaya erişmek için lütfen giriş yapın.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      )
    )
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-muted">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Yetkisiz Erişim
            </h2>
            <p className="text-muted-foreground mb-8">
              Bu sayfaya erişim yetkiniz bulunmuyor.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}