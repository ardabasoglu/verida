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
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={acceptedTypes.join(',')}
        className="hidden"
      />

      <div className="text-center">
        <LoadingButton
          type="button"
          onClick={handleFileSelect}
          isLoading={isUploading}
          loadingText="Yükleniyor..."
          className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
        >
          <span className="text-lg">📎</span>
          Dosya Seç
        </LoadingButton>
      </div>

      {isUploading && (
        <div className="space-y-3 bg-muted/30 rounded-lg p-4 border border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Dosya yükleniyor...</span>
            <span className="text-muted-foreground">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-border/50 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {validationError && (
        <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-semibold text-orange-800 mb-1">Dosya Doğrulama Hatası</p>
              <p className="text-sm text-orange-700">{validationError}</p>
              <button
                onClick={() => setValidationError(null)}
                className="mt-2 text-xs text-orange-600 hover:text-orange-800 font-medium underline"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-semibold text-red-800 mb-1">Dosya Yükleme Hatası</p>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium underline"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-muted/20 rounded-lg p-4 border border-border/30">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">Desteklenen Formatlar</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            PDF, Word, Excel, JPEG, PNG, GIF, WebP
          </p>
          <p className="text-xs text-muted-foreground">
            Maksimum dosya boyutu: <span className="font-semibold">{maxSizeInMB}MB</span>
          </p>
        </div>
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
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Ekli Dosyalar ({files.length})
        </h4>
      </div>
      <div className="space-y-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="group flex items-center justify-between p-4 bg-background border-2 border-border/50 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center">
                <span className="text-lg">{getFileIcon(file.mimeType)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {file.originalName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getFileTypeLabel(file.mimeType)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemoveFile(file.id)}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Dosyayı kaldır"
            >
              <span className="text-sm font-bold">×</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
