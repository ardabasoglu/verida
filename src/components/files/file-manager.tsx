'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import FileUpload, { FileList } from '@/components/editor/file-upload'
import { getFileTypeLabel, getFileIcon, formatFileSize } from '@/lib/file-utils-client'

interface FileData {
  id: string
  filename: string
  originalName: string
  mimeType: string
  fileSize: number
  createdAt: string
  uploadedBy: {
    id: string
    name: string
    email: string
  }
  page?: {
    id: string
    title: string
    pageType: string
  }
}

interface FileManagerProps {
  pageId?: string
  userId?: string
  allowUpload?: boolean
  allowDelete?: boolean
  showPageInfo?: boolean
  className?: string
}

export default function FileManager({
  pageId,
  userId,
  allowUpload = true,
  allowDelete = true,
  showPageInfo = false,
  className = ''
}: FileManagerProps) {
  const [files, setFiles] = useState<FileData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchFiles = async (pageNum = 1) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10'
      })

      if (pageId) params.append('pageId', pageId)
      if (userId) params.append('userId', userId)

      const response = await fetch(`/api/files?${params}`)
      
      if (!response.ok) {
        throw new Error('Dosyalar yüklenemedi')
      }

      const result = await response.json()
      
      if (result.success) {
        setFiles(result.data)
        setTotalPages(result.pagination.totalPages)
        setPage(result.pagination.page)
      } else {
        throw new Error(result.error || 'Dosyalar yüklenemedi')
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      setError(error instanceof Error ? error.message : 'Dosyalar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [pageId, userId])

  const handleFileUploaded = (newFile: { id: string; filename: string; originalName: string; mimeType: string }) => {
    // Refresh the file list to get the complete file data
    fetchFiles(page)
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      setDeleting(fileId)
      
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Dosya silinemedi')
      }

      // Remove file from local state
      setFiles(prev => prev.filter(file => file.id !== fileId))
    } catch (error) {
      console.error('Error deleting file:', error)
      alert(error instanceof Error ? error.message : 'Dosya silinemedi')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownloadFile = (fileId: string, filename: string) => {
    const link = document.createElement('a')
    link.href = `/api/files/${fileId}?download=true`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && files.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-border rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-border rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Section */}
      {allowUpload && (
        <div className="border-b pb-4">
          <h3 className="text-lg font-medium text-foreground mb-3">Dosya Yükle</h3>
          <FileUpload onFileUploaded={handleFileUploaded} />
        </div>
      )}

      {/* Files List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-foreground">
            Dosyalar {files.length > 0 && `(${files.length})`}
          </h3>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => fetchFiles(page)}
              className="mt-2 text-sm text-red-700 underline hover:no-underline"
            >
              Tekrar dene
            </button>
          </div>
        )}

        {files.length === 0 && !loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📁</div>
            <p>Henüz dosya yüklenmemiş</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-2xl flex-shrink-0">
                    {getFileIcon(file.mimeType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {file.originalName}
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                        {getFileTypeLabel(file.mimeType)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>•</span>
                      <span>{formatDate(file.createdAt)}</span>
                      <span>•</span>
                      <span>{file.uploadedBy.name || file.uploadedBy.email}</span>
                    </div>

                    {showPageInfo && file.page && (
                      <div className="mt-1 text-xs text-blue-600">
                        📄 {file.page.title}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    type="button"
                    onClick={() => handleDownloadFile(file.id, file.originalName)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    İndir
                  </Button>
                  
                  {allowDelete && (
                    <Button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      disabled={deleting === file.id}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting === file.id ? 'Siliniyor...' : 'Sil'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-foreground">
              Sayfa {page} / {totalPages}
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => fetchFiles(page - 1)}
                disabled={page <= 1 || loading}
                className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50"
              >
                Önceki
              </Button>
              
              <Button
                onClick={() => fetchFiles(page + 1)}
                disabled={page >= totalPages || loading}
                className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50"
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}