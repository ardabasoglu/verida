'use client';

import { useState, useRef } from 'react';
import { getFileTypeLabel, getFileIcon } from '@/lib/file-utils-client';
import { LoadingButton } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-boundary';
import { useApiMutation } from '@/lib/api-client';

interface FileUploadProps {
  onFileUploaded: (file: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
  }) => void;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const DEFAULT_MAX_SIZE_MB = 10;

export default function FileUpload({
  onFileUploaded,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeInMB = DEFAULT_MAX_SIZE_MB,
  className = '',
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    loading: isUploading,
    error,
    execute,
  } = useApiMutation({
    successMessage: 'Dosya başarıyla yüklendi',
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setValidationError(null);

    // Client-side validation
    if (!acceptedTypes.includes(file.type)) {
      setValidationError(
        'Desteklenmeyen dosya türü. Lütfen PDF, Word, Excel veya görsel dosyası seçin.'
      );
      return;
    }

    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setValidationError(`Dosya boyutu ${maxSizeInMB}MB'dan büyük olamaz.`);
      return;
    }

    setUploadProgress(0);

    // Use the enhanced API client with progress tracking
    const result = await execute(async () => {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      try {
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Dosya yükleme başarısız');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Dosya yükleme başarısız');
        }

        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    });

    if (
      result &&
      typeof result === 'object' &&
      result !== null &&
      'data' in (result as Record<string, unknown>)
    ) {
      onFileUploaded(
        (
          result as {
            data: {
              id: string;
              filename: string;
              originalName: string;
              mimeType: string;
            };
          }
        ).data
      );
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={acceptedTypes.join(',')}
        className="hidden"
      />

      <LoadingButton
        type="button"
        onClick={handleFileSelect}
        isLoading={isUploading}
        loadingText="Yükleniyor..."
        className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        📎 Dosya Ekle
      </LoadingButton>

      {isUploading && (
        <div className="space-y-1">
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {uploadProgress}% tamamlandı
          </p>
        </div>
      )}

      {validationError && (
        <ErrorDisplay
          message={validationError}
          type="warning"
          title="Dosya Doğrulama Hatası"
          action={{ label: 'Tamam', onClick: () => setValidationError(null) }}
        />
      )}

      {error && (
        <ErrorDisplay
          message={error}
          type="error"
          title="Dosya Yükleme Hatası"
          action={{
            label: 'Tekrar Dene',
            onClick: () => fileInputRef.current?.click(),
          }}
        />
      )}

      <div className="text-xs text-muted-foreground">
        Desteklenen formatlar: PDF, Word, Excel, JPEG, PNG, GIF, WebP
        <br />
        Maksimum dosya boyutu: {maxSizeInMB}MB
      </div>
    </div>
  );
}

interface AttachedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
}

interface FileListProps {
  files: AttachedFile[];
  onRemoveFile: (fileId: string) => void;
  className?: string;
}

export function FileList({
  files,
  onRemoveFile,
  className = '',
}: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-foreground">Ekli Dosyalar:</h4>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-2 bg-muted border border-border rounded-md"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getFileIcon(file.mimeType)}</span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {file.originalName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getFileTypeLabel(file.mimeType)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemoveFile(file.id)}
              className="text-red-600 hover:text-red-800 p-1"
              title="Dosyayı kaldır"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
