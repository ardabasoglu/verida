'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentType } from '@prisma/client';
import { CreatePageRequest, UpdatePageRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RichTextEditor from '@/components/editor/rich-text-editor';
import FileUpload, { FileList } from '@/components/editor/file-upload';
import { YouTubeVideoManager } from '@/components/pages/youtube-video-manager';
import TagInput from '@/components/forms/tag-input';
import { type YouTubeVideoInfo } from '@/lib/youtube-utils';

interface AttachedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
}

interface PageFormData {
  title: string;
  content: string;
  pageType: ContentType;
  tags: string[];
  youtubeVideos?: YouTubeVideoInfo[];
}

interface PageFormProps {
  initialData?: {
    id?: string;
    title: string;
    content: string;
    pageType: ContentType;
    tags: string[];
    files?: AttachedFile[];
    youtubeVideos?: YouTubeVideoInfo[];
  };
  onSubmit?: (
    data:
      | CreatePageRequest
      | (UpdatePageRequest & { youtubeVideos?: YouTubeVideoInfo[] })
  ) => Promise<void>;
  isEditing?: boolean;
}

const PAGE_TYPE_OPTIONS = [
  {
    value: 'INFO' as ContentType,
    label: 'Bilgi',
    description: 'Genel bilgi ve açıklamalar',
  },
  {
    value: 'PROCEDURE' as ContentType,
    label: 'Prosedür',
    description: 'İş süreçleri ve prosedürler',
  },
  {
    value: 'ANNOUNCEMENT' as ContentType,
    label: 'Duyuru',
    description: 'Önemli duyurular ve haberler',
  },
  {
    value: 'WARNING' as ContentType,
    label: 'Uyarı',
    description: 'Dikkat edilmesi gereken konular',
  },
];

export default function PageForm({
  initialData,
  onSubmit,
  isEditing = false,
}: PageFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<PageFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    pageType: initialData?.pageType || ('INFO' as ContentType),
    tags: initialData?.tags || [],
    youtubeVideos: initialData?.youtubeVideos || [],
  });

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(
    initialData?.files || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Basic validation
      const newErrors: Record<string, string> = {};

      if (!formData.title.trim()) {
        newErrors.title = 'Başlık gereklidir';
      }

      if (!formData.content.trim()) {
        newErrors.content = 'İçerik gereklidir';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default API call
        const url =
          isEditing && initialData?.id
            ? `/api/pages/${initialData.id}`
            : '/api/pages';

        const method = isEditing ? 'PUT' : 'POST';

        const requestData = {
          ...formData,
          fileIds: attachedFiles.map((file) => file.id),
        };

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Bir hata oluştu');
        }

        const result = await response.json();

        if (result.success) {
          router.push(`/pages/${result.data.id}`);
        } else {
          throw new Error(result.error || 'Bir hata oluştu');
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Bir hata oluştu',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUploaded = (file: AttachedFile) => {
    setAttachedFiles((prev) => [...prev, file]);
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const handleYouTubeVideosChange = (videos: YouTubeVideoInfo[]) => {
    setFormData((prev) => ({ ...prev, youtubeVideos: videos }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label
                htmlFor="title"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Başlık *
              </Label>
              <Input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className={errors.title ? 'border-red-500' : ''}
                placeholder="Sayfa başlığını giriniz"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Page Type */}
            <div>
              <Label
                htmlFor="pageType"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Sayfa Tipi *
              </Label>
              <Select
                value={formData.pageType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    pageType: value as ContentType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sayfa tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div>
              <Label
                htmlFor="content"
                className="block text-sm font-medium text-foreground mb-2"
              >
                İçerik *
              </Label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) =>
                  setFormData((prev) => ({ ...prev, content }))
                }
                placeholder="Sayfa içeriğinizi yazın..."
                className={errors.content ? 'border-red-500' : ''}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>

            {/* File Upload */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">
                Dosya Ekleri
              </Label>
              <FileUpload
                onFileUploaded={handleFileUploaded}
                className="mb-4"
              />
              <FileList files={attachedFiles} onRemoveFile={handleRemoveFile} />
            </div>

            {/* YouTube Videos */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">
                YouTube Videoları
              </Label>
              <YouTubeVideoManager
                videos={formData.youtubeVideos || []}
                onVideosChange={handleYouTubeVideosChange}
                maxVideos={5}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Sayfanıza YouTube videoları ekleyebilirsiniz. Videolar sayfa
                içeriğinde görüntülenecektir.
              </p>
            </div>

            {/* Tags */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2">
                Etiketler
              </Label>
              <TagInput
                tags={formData.tags}
                onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
                placeholder="Etiket ekle..."
                maxTags={10}
              />
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                onClick={() => router.back()}
                variant="outline"
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting} variant="default">
                {isSubmitting
                  ? 'Kaydediliyor...'
                  : isEditing
                    ? 'Güncelle'
                    : 'Oluştur'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
