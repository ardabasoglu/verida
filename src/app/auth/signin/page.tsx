import { Metadata } from 'next'
import { Suspense } from 'react'
import { SignInForm } from '@/components/auth/signin-form'

export const metadata: Metadata = {
  title: 'Giriş Yap - Verida',
  description: 'Verida kurumsal bilgi sistemine giriş yapın',
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Hesabınıza giriş yapın
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sadece @dgmgumruk.com e-posta adresleri kabul edilir
          </p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  )
}