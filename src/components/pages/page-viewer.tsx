'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { PageWithRelations } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageSpecificBreadcrumb } from '@/components/pages/page-breadcrumb';
import FileAttachments from '@/components/files/file-attachments';
import CommentSection from '@/components/comments/comment-section';
import DOMPurify from 'dompurify';

interface PageViewerProps {
  page: PageWithRelations;
  onDelete?: () => void;
  showBreadcrumbs?: boolean;
}

const PAGE_TYPE_LABELS = {
  INFO: 'Bilgi',
  PROCEDURE: 'Prosedür',
  ANNOUNCEMENT: 'Duyuru',
  WARNING: 'Uyarı',
};

export default function PageViewer({
  page,
  onDelete,
  showBreadcrumbs = true,
}: PageViewerProps) {
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sanitize HTML content
  const sanitizedContent = useMemo(() => {
    if (!page.content) return '';

    return DOMPurify.sanitize(page.content, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        's',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'blockquote',
        'a',
        'img',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'div',
        'span',
        'iframe',
        'hr',
      ],
      ALLOWED_ATTR: [
        'href',
        'src',
        'alt',
        'title',
        'class',
        'width',
        'height',
        'frameborder',
        'allowfullscreen',
        'allow',
      ],
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
  }, [page.content]);

  const canEdit =
    session?.user &&
    (page.authorId === session.user.id ||
      ['ADMIN', 'SYSTEM_ADMIN'].includes(session.user.role));

  const canDelete = canEdit;

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Silme işlemi başarısız');
      }

      const result = await response.json();

      if (result.success) {
        if (onDelete) {
          onDelete();
        } else {
          // Redirect to pages list
          window.location.href = '/pages';
        }
      } else {
        throw new Error(result.error || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Silme işlemi başarısız');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <div className="mb-6">
          <PageSpecificBreadcrumb
            pageTitle={page.title}
            pageType={page.pageType}
            pageId={page.id}
          />
        </div>
      )}

      {/* Header */}
      <div className="bg-card rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-foreground">
                {page.title}
              </h1>
              <Badge
                label={PAGE_TYPE_LABELS[page.pageType]}
                color={
                  page.pageType === 'INFO'
                    ? 'blue'
                    : page.pageType === 'PROCEDURE'
                      ? 'green'
                      : page.pageType === 'ANNOUNCEMENT'
                        ? 'yellow'
                        : page.pageType === 'WARNING'
                          ? 'red'
                          : 'gray'
                }
              />
            </div>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Yazar:</span>
                <span>{page.author.name || page.author.email}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">Oluşturulma:</span>
                <span>{formatDate(page.createdAt)}</span>
              </div>
              {page.updatedAt !== page.createdAt && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Güncelleme:</span>
                    <span>{formatDate(page.updatedAt)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Tags */}
            {page.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {page.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-muted text-foreground text-sm rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex gap-2 ml-4">
              <Link href={`/pages/${page.id}/edit`}>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  Düzenle
                </Button>
              </Link>
              {canDelete && (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Sil
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-card rounded-lg shadow-md p-6 mb-6">
        <div className="prose max-w-none">
          {sanitizedContent ? (
            <div
              className="text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          ) : (
            <p className="text-muted-foreground italic">
              Bu sayfada henüz içerik bulunmuyor.
            </p>
          )}
        </div>
      </div>

      {/* Files */}
      {page.files && page.files.length > 0 && (
        <div className="bg-card rounded-lg shadow-md p-6 mb-6">
          <FileAttachments
            files={page.files.map((file) => ({
              ...file,
              fileSize: Number(file.fileSize),
              createdAt: file.createdAt.toISOString(),
            }))}
          />
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <CommentSection
          pageId={page.id}
          pageAuthorId={page.authorId}
          initialCommentCount={page.comments?.length || 0}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sayfayı Sil</DialogTitle>
            <DialogDescription>
              Bu sayfayı silmek istediğinizden emin misiniz? Bu işlem geri
              alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Siliniyor...' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <div className="mt-8 pt-6 border-t border-border">
        <Link href="/pages">
          <Button className="bg-gray-600 text-white hover:bg-gray-700">
            ← Sayfalara Dön
          </Button>
        </Link>
      </div>
    </div>
  );
}
