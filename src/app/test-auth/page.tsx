import { getCurrentUser } from '@/lib/auth-utils'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Test Authentication - Verida',
  description: 'Test authentication functionality',
}

export default async function TestAuthPage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Authentication Test
        </h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              User ID:
            </label>
            <p className="mt-1 text-sm text-gray-900">{user.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email:
            </label>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name:
            </label>
            <p className="mt-1 text-sm text-gray-900">{user.name || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role:
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {user.role === 'SYSTEM_ADMIN' && 'Sistem Yöneticisi'}
              {user.role === 'ADMIN' && 'Yönetici'}
              {user.role === 'EDITOR' && 'Editör'}
              {user.role === 'MEMBER' && 'Üye'}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  )
}