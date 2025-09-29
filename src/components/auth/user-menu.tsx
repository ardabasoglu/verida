'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useAuth } from '@/hooks/use-auth'

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  if (!user) return null

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-white font-medium">
            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-foreground">{user.name || user.email}</span>
        <svg
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-foreground border-b">
            <p className="font-medium">{user.name || 'Kullanıcı'}</p>
            <p className="text-muted-foreground">{user.email}</p>
            <p className="text-xs text-blue-600 mt-1">
              {user.role === 'SYSTEM_ADMIN' && 'Sistem Yöneticisi'}
              {user.role === 'ADMIN' && 'Yönetici'}
              {user.role === 'EDITOR' && 'Editör'}
              {user.role === 'MEMBER' && 'Üye'}
            </p>
          </div>
          <a
            href="/settings"
            className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
            onClick={() => setIsOpen(false)}
          >
            ⚙️ Ayarlar
          </a>
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  )
}