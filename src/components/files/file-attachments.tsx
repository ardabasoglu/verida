'use client';

import {
  getFileTypeLabel,
  getFileIcon,
  formatFileSize,
  isImageFile,
} from '@/lib/file-utils-client';

interface FileAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string | null;
  fileSize: number;
  createdAt: string;
}

interface FileAttachmentsProps {
  files: FileAttachment[];
  className?: string;
  showPreview?: boolean;
}

export default function FileAttachments({
  files,
  className = '',
  showPreview = true,
}: FileAttachmentsProps) {
  if (!files || files.length === 0) {
    return null;
  }

  const handleDownload = (fileId: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/files/${fileId}?download=true`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (fileId: string) => {
    window.open(`/api/files/${fileId}`, '_blank');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-foreground border-b pb-2">
        📎 Ekli Dosyalar ({files.length})
      </h4>

      <div className="grid gap-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 bg-muted border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="text-xl flex-shrink-0">
                {getFileIcon(file.mimeType)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h5 className="text-sm font-medium text-foreground truncate">
                    {file.originalName}
                  </h5>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-card text-foreground border">
                    {getFileTypeLabel(file.mimeType)}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                  <span>{formatFileSize(file.fileSize)}</span>
                  <span>•</span>
                  <span>
                    {new Date(file.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {showPreview &&
                (isImageFile(file.mimeType) ||
                  file.mimeType === 'application/pdf') && (
                  <button
                    onClick={() => handleView(file.id)}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    title="Görüntüle"
                  >
                    👁️ Görüntüle
                  </button>
                )}

              <button
                onClick={() => handleDownload(file.id, file.originalName)}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title="İndir"
              >
                ⬇️ İndir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
