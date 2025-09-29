'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Page, ContentType } from '@prisma/client';
import { createPageSchema } from '@/lib/validations';
import { useToast } from '@/components/ui/toast';
import { useApiMutation } from '@/lib/api-client';
import { useFormValidation } from '@/components/ui/form-field';
import { FormField, Input, Textarea, Select } from '@/components/ui/form-field';
import {
  TagIcon,
  PaperClipIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { LoadingButton } from '@/components/ui/loading';
import { ErrorDisplay, ErrorBoundary } from '@/components/ui/error-boundary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FileUpload, { FileList } from '@/components/editor/file-upload';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

interface PageFormData {
  title: string;
  content: string;
  pageType: ContentType;
  tags: string[];
  published: boolean;
  fileIds?: string[];
}

interface AttachedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
}

interface EnhancedPageFormProps {
  initialData?: Partial<PageFormData>;
  pageId?: string;
  onSuccess?: (page: Page) => void;
  onCancel?: () => void;
}

export function EnhancedPageForm({
  initialData,
  pageId,
  onSuccess,
  onCancel,
}: EnhancedPageFormProps) {
  const router = useRouter();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState<PageFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    pageType: initialData?.pageType || 'INFO',
    tags: initialData?.tags || [],
    published: initialData?.published || false,
    fileIds: initialData?.fileIds || [],
  });

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Form validation
  const { errors, validate, validateField, clearFieldError, hasErrors } =
    useFormValidation(createPageSchema);

  // API mutation
  const { loading, error, execute } = useApiMutation({
    successMessage: pageId
      ? 'Sayfa başarıyla güncellendi'
      : 'Sayfa başarıyla oluşturuldu',
  });

  // Page type options
  const pageTypeOptions = [
    { value: 'INFO', label: 'Bilgi' },
    { value: 'PROCEDURE', label: 'Prosedür' },
    { value: 'ANNOUNCEMENT', label: 'Duyuru' },
    { value: 'WARNING', label: 'Uyarı' },
  ];

  // Handle form field changes with validation
  const handleFieldChange = async (
    field: keyof PageFormData,
    value: string | ContentType
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      clearFieldError(field);
    }

    // Validate field on blur for better UX
    if (value && typeof value === 'string' && value.trim()) {
      await validateField(field, value);
    }
  };
  // Handle tag management
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      const newTags = [...formData.tags, tag];
      setFormData((prev) => ({ ...prev, tags: newTags }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = formData.tags.filter((tag) => tag !== tagToRemove);
    setFormData((prev) => ({ ...prev, tags: newTags }));
  };

  // Handle file management
  const handleFileUploaded = (file: AttachedFile) => {
    setAttachedFiles((prev) => [...prev, file]);
    setFormData((prev) => ({
      ...prev,
      fileIds: [...(prev.fileIds || []), file.id],
    }));
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
    setFormData((prev) => ({
      ...prev,
      fileIds: (prev.fileIds || []).filter((id) => id !== fileId),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate entire form
    const isValid = await validate(formData);
    if (!isValid) {
      toast.error('Form Hatası', 'Lütfen form hatalarını düzeltin');
      return;
    }

    // Submit form
    const result = await execute(async () => {
      const endpoint = pageId ? `/pages/${pageId}` : '/pages';
      const method = pageId ? 'PUT' : 'POST';

      const response = await fetch(`/api${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'İşlem başarısız oldu');
      }

      return response.json();
    });

    if (
      result &&
      typeof result === 'object' &&
      result !== null &&
      'data' in (result as Record<string, unknown>)
    ) {
      const resultData = (result as { data: Page }).data;
      if (onSuccess) {
        onSuccess(resultData);
      } else {
        router.push(`/pages/${resultData.id}`);
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto p-6">
        <Card variant="default">
          <CardHeader>
            <CardTitle>
              {pageId ? 'Sayfayı Düzenle' : 'Yeni Sayfa Oluştur'}
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Global error display */}
            {error && (
              <ErrorDisplay
                message={error}
                type="error"
                title="Form Hatası"
                action={{
                  label: 'Sayfayı Yenile',
                  onClick: () => window.location.reload(),
                }}
              />
            )}

            {/* Title field */}
            <FormField label="Başlık" required error={errors.title}>
              <Input
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Sayfa başlığını girin"
                error={errors.title}
                maxLength={200}
              />
            </FormField>

            {/* Page type field */}
            <FormField
              label="Sayfa Türü"
              required
              error={errors.pageType}
              description="Sayfanın türünü seçin"
              icon={<InformationCircleIcon className="h-4 w-4 text-blue-500" />}
              help="Bilgi, Prosedür, Duyuru veya Uyarı seçebilirsiniz."
            >
              <Select
                value={formData.pageType}
                onChange={(e) =>
                  handleFieldChange('pageType', e.target.value as ContentType)
                }
                options={pageTypeOptions}
                error={errors.pageType}
              />
            </FormField>

            {/* Content field */}
            <FormField
              label="İçerik"
              error={errors.content}
              description="Sayfa içeriğini girin (Markdown desteklenir)"
            >
              <Textarea
                value={formData.content}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                placeholder="Sayfa içeriğini yazın..."
                rows={10}
                error={errors.content}
              />
            </FormField>

            {/* Tags field */}
            <FormField
              label="Etiketler"
              error={errors.tags}
              description="Sayfayı kategorize etmek için etiketler ekleyin"
              icon={<TagIcon className="h-4 w-4 text-blue-500" />}
              help="Etiketler arama ve filtreleme için kullanılır."
            >
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Etiket ekle..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                    disabled={!tagInput.trim()}
                  >
                    Ekle
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span key={tag} className="flex items-center">
                        <Badge
                          label={tag}
                          color="blue"
                          className="text-xs px-2 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            {/* File upload */}
            <FormField
              label="Dosya Ekleri"
              description="PDF, Word, Excel ve görsel dosyaları ekleyebilirsiniz"
              icon={<PaperClipIcon className="h-4 w-4 text-green-500" />}
              help="En fazla 10MB dosya yükleyebilirsiniz."
            >
              <div className="space-y-4">
                <FileUpload
                  onFileUploaded={handleFileUploaded}
                  maxSizeInMB={10}
                />

                <FileList
                  files={attachedFiles}
                  onRemoveFile={handleRemoveFile}
                />
              </div>
            </FormField>

            {/* Form actions */}
            <CardFooter
              actions={
                <div className="flex space-x-3">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={loading}
                    >
                      İptal
                    </Button>
                  )}
                  <LoadingButton
                    type="submit"
                    isLoading={loading}
                    loadingText={
                      pageId ? 'Güncelleniyor...' : 'Oluşturuluyor...'
                    }
                    disabled={hasErrors}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {pageId ? 'Güncelle' : 'Oluştur'}
                  </LoadingButton>
                </div>
              }
            />
          </form>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

export default EnhancedPageForm;
