'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import FileManager from '@/components/files/file-manager'
import FileUpload, { FileList } from '@/components/editor/file-upload'

interface AttachedFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
}

export default function TestFileUploadPage() {
  const { data: session, status } = useSession()
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])

  if (status === 'loading') {
    return <div className="p-6">Yükleniyor...</div>
  }

  if (!session) {
    return <div className="p-6">Bu sayfayı görüntülemek için giriş yapmalısınız.</div>
  }

  const handleFileUploaded = (file: AttachedFile) => {
    setAttachedFiles(prev => [...prev, file])
  }

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dosya Yükleme Testi</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Simple File Upload Component */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basit Dosya Yükleme</h2>
          
          <FileUpload
            onFileUploaded={handleFileUploaded}
            className="mb-4"
          />
          
          <FileList
            files={attachedFiles}
            onRemoveFile={handleRemoveFile}
          />
          
          {attachedFiles.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                {attachedFiles.length} dosya yüklendi. Bu dosyalar bir sayfaya eklenebilir.
              </p>
            </div>
          )}
        </div>

        {/* File Manager Component */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dosya Yöneticisi</h2>
          
          <FileManager
            userId={session.user.id}
            allowUpload={true}
            allowDelete={true}
            showPageInfo={true}
          />
        </div>
      </div>

      {/* Test Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Test Bilgileri</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Desteklenen Dosya Türleri:</strong> PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Resimler (JPEG, PNG, GIF, WebP)</p>
          <p><strong>Maksimum Dosya Boyutu:</strong> 10MB</p>
          <p><strong>Depolama:</strong> Coolify volume (./uploads klasörü)</p>
          <p><strong>Güvenlik:</strong> Sadece editör ve üzeri roller dosya yükleyebilir</p>
          <p><strong>Kullanıcı Rolü:</strong> {session.user.role}</p>
        </div>
      </div>

      {/* API Test Buttons */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">API Test Butonları</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fetch('/api/files').then(r => r.json()).then(console.log)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Dosyaları Listele (Console&apos;a yazdır)
          </button>
          
          <button
            onClick={() => fetch('/api/health').then(r => r.json()).then(console.log)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Sistem Durumu (Console&apos;a yazdır)
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Sonuçları görmek için tarayıcı geliştirici araçlarındaki Console sekmesini kontrol edin.
        </p>
      </div>
    </div>
  )
}