import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'E-posta Doğrulama - Verida',
  description: 'E-posta adresinizi kontrol edin',
}

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-green-600">
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
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            E-postanızı kontrol edin
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Size bir giriş linki gönderdik. E-posta kutunuzu kontrol edin ve linke tıklayarak giriş yapın.
          </p>
          <p className="mt-4 text-xs text-gray-500">
            E-posta gelmedi mi? Spam klasörünüzü kontrol edin veya birkaç dakika bekleyin.
          </p>
        </div>
        <div className="text-center">
          <Link
            href="/auth/signin"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Giriş sayfasına geri dön
          </Link>
        </div>
      </div>
    </div>
  )
}