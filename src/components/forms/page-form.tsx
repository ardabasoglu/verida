'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentType } from '@prisma/client';
import { CreatePageRequest, UpdatePageRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
import { FormSection, FormFieldGroup, FormField } from '@/components/forms/form-section';
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
          // Redirect to view page after editing
          router.push(`/view/${result.data.id}`);
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
    <div className="w-full">
      <Card variant="elevated" className="shadow-xl border-0">
        <CardContent className="px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-16">
            {/* Basic Information Section */}
            <FormSection
              title="Temel Bilgiler"
              description="Sayfanızın başlığını ve tipini belirleyin"
            >
              <FormFieldGroup>
                {/* Title */}
                <FormField>
                  <Label htmlFor="title">
                    Başlık *
                  </Label>
                  <Input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className={errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    placeholder="Sayfa başlığını giriniz"
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 bg-red-600 rounded-full flex-shrink-0"></span>
                      {errors.title}
                    </p>
                  )}
                </FormField>

                {/* Page Type */}
                <FormField>
                  <Label htmlFor="pageType">
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
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">{option.label}</span>
                            <span className="text-sm text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </FormFieldGroup>
            </FormSection>

            {/* Content Section */}
            <FormSection
              title="İçerik"
              description="Sayfanızın ana içeriğini oluşturun"
              variant="highlighted"
            >
              <FormField>
                <Label htmlFor="content">
                  İçerik *
                </Label>
                <div className={`rounded-lg border-2 transition-all duration-200 ${errors.content
                    ? 'border-red-500 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/20'
                    : 'border-input focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20'
                  }`}>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) =>
                      setFormData((prev) => ({ ...prev, content }))
                    }
                    placeholder="Sayfa içeriğinizi yazın..."
                    className="border-0 focus:ring-0"
                  />
                </div>
                {errors.content && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-red-600 rounded-full flex-shrink-0"></span>
                    {errors.content}
                  </p>
                )}
              </FormField>
            </FormSection>

            {/* Media Section */}
            <FormSection
              title="Medya ve Ekler"
              description="Sayfanıza dosyalar ve videolar ekleyin"
            >
              <FormFieldGroup columns={2}>
                {/* File Upload */}
                <FormField>
                  <Label>
                    Dosya Ekleri
                  </Label>
                  <div className="rounded-lg border-2 border-dashed border-border p-8 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5">
                    <FileUpload
                      onFileUploaded={handleFileUploaded}
                      className="mb-4"
                    />
                  </div>
                  <FileList files={attachedFiles} onRemoveFile={handleRemoveFile} />
                </FormField>

                {/* YouTube Videos */}
                <FormField>
                  <Label>
                    YouTube Videoları
                  </Label>
                  <div className="rounded-lg border-2 border-border p-8 bg-muted/30">
                    <YouTubeVideoManager
                      videos={formData.youtubeVideos || []}
                      onVideosChange={handleYouTubeVideosChange}
                      maxVideos={5}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sayfanıza YouTube videoları ekleyebilirsiniz. Videolar sayfa
                    içeriğinde görüntülenecektir.
                  </p>
                </FormField>
              </FormFieldGroup>
            </FormSection>

            {/* Metadata Section */}
            <FormSection
              title="Etiketler ve Metadata"
              description="Sayfanızı kategorize etmek için etiketler ekleyin"
              variant="subtle"
            >
              <FormField>
                <Label>
                  Etiketler
                </Label>
                <div className="rounded-lg border-2 border-border p-6 bg-background">
                  <TagInput
                    tags={formData.tags}
                    onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
                    placeholder="Etiket ekle..."
                    maxTags={10}
                  />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Maksimum 10 etiket ekleyebilirsiniz. Etiketler sayfanızın bulunabilirliğini artırır.
                </p>
              </FormField>
            </FormSection>

            {/* Submit Error */}
            {errors.submit && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2"></div>
                  <div>
                    <p className="text-sm font-semibold text-red-800 mb-1">Hata Oluştu</p>
                    <p className="text-sm text-red-700">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions Separator */}
            <div className="relative py-12">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60"></div>
              </div>
              <div className="relative flex justify-center">
                <div className="bg-background px-8 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary/40 rounded-full"></div>
                    <div className="w-8 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full"></div>
                    <div className="w-2 h-2 bg-primary/40 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 rounded-2xl p-8 border border-border/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                {/* Action Description */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {isEditing ? 'Değişiklikleri Kaydet' : 'Sayfayı Yayınla'}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isEditing
                      ? 'Yaptığınız değişiklikleri kaydetmek için "Güncelle" butonuna tıklayın.'
                      : 'Sayfanız oluşturulduktan sonra tüm kullanıcılar tarafından görülebilir olacaktır.'
                    }
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Button
                    type="button"
                    onClick={() => router.back()}
                    variant="outline"
                    size="lg"
                    className="
                        h-14 px-8 text-base font-semibold 
                        border-2 border-border/80 
                        bg-background/80 backdrop-blur-sm
                        hover:bg-muted/60 hover:border-border 
                        focus-visible:ring-2 focus-visible:ring-muted-foreground/20 
                        transition-all duration-200 
                        hover:shadow-md hover:scale-[1.02]
                        active:scale-[0.98]
                        disabled:hover:scale-100 disabled:hover:shadow-none
                        group
                      "
                    disabled={isSubmitting}
                  >
                    <span className="group-hover:translate-x-[-2px] transition-transform duration-200">
                      İptal
                    </span>
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="default"
                    size="lg"
                    loading={isSubmitting}
                    loadingText={isEditing ? 'Güncelleniyor...' : 'Oluşturuluyor...'}
                    className="
                        h-14 px-10 text-base font-bold 
                        bg-gradient-to-r from-primary via-primary to-primary/90
                        hover:from-primary/90 hover:via-primary hover:to-primary
                        shadow-lg hover:shadow-xl 
                        focus-visible:ring-2 focus-visible:ring-primary/30
                        transition-all duration-200 
                        hover:scale-[1.02] hover:-translate-y-0.5
                        active:scale-[0.98] active:translate-y-0
                        disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:hover:shadow-lg
                        relative overflow-hidden
                        group
                      "
                  >
                    <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-200">
                      {isSubmitting
                        ? (isEditing ? 'Güncelleniyor...' : 'Oluşturuluyor...')
                        : isEditing
                          ? 'Sayfayı Güncelle'
                          : 'Sayfayı Oluştur'}
                    </span>
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
                  </Button>
                </div>
              </div>

              {/* Additional Action Info */}
              <div className="mt-6 pt-6 border-t border-border/30">
                <div className="flex items-start gap-3 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full flex-shrink-0 mt-1.5"></div>
                  <p className="leading-relaxed">
                    {isEditing
                      ? 'Güncelleme işlemi tamamlandıktan sonra sayfa otomatik olarak yeniden yüklenecektir.'
                      : 'Sayfa oluşturulduktan sonra düzenleme yapmak için sayfa detay sayfasındaki "Düzenle" butonunu kullanabilirsiniz.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
