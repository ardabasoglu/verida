import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Giriş Hatası - Verida',
  description: 'Giriş yaparken bir hata oluştu',
}

function ErrorContent({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error

  const getErrorMessage = (error: string | undefined) => {
    switch (error) {
      case 'AccessDenied':
        return {
          title: 'Erişim Reddedildi',
          message: 'Sadece @dgmgumruk.com e-posta adresleri ile giriş yapabilirsiniz.',
        }
      case 'Verification':
        return {
          title: 'Doğrulama Hatası',
          message: 'Doğrulama linki geçersiz veya süresi dolmuş. Lütfen tekrar deneyin.',
        }
      case 'Configuration':
        return {
          title: 'Yapılandırma Hatası',
          message: 'Sistem yapılandırma hatası. Lütfen sistem yöneticisi ile iletişime geçin.',
        }
      default:
        return {
          title: 'Giriş Hatası',
          message: 'Giriş yaparken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg
              className="h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {errorInfo.message}
          </p>
        </div>
        <div className="text-center space-y-4">
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Tekrar dene
          </Link>
          <Link
            href="/"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolved = await searchParams;
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <ErrorContent searchParams={resolved} />
    </Suspense>
  )
}