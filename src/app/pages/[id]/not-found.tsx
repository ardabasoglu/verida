import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sayfa Bulunamadı
          </h1>
          <p className="text-gray-600 mb-6">
            Aradığınız sayfa mevcut değil veya erişim yetkiniz bulunmuyor.
          </p>
          <div className="space-y-3">
            <Link href="/pages">
              <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                Sayfalara Dön
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50">
                Ana Sayfaya Dön
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}