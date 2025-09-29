'use client';

import Link from 'next/link';
import { PageWithRelations } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  SpeakerWaveIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';

interface SearchResultsProps {
  results: PageWithRelations[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  searchQuery?: string;
}

const PAGE_TYPE_CONFIG = {
  INFO: {
    label: 'Bilgi',
    icon: DocumentTextIcon,
    color: 'blue',
  },
  PROCEDURE: {
    label: 'Prosedür',
    icon: ClipboardDocumentListIcon,
    color: 'green',
  },
  ANNOUNCEMENT: {
    label: 'Duyuru',
    icon: SpeakerWaveIcon,
    color: 'yellow',
  },
  WARNING: {
    label: 'Uyarı',
    icon: ExclamationTriangleIcon,
    color: 'red',
  },
};

export default function SearchResults({
  results,
  loading,
  error,
  pagination,
  onPageChange,
  searchQuery,
}: SearchResultsProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const highlightSearchTerm = (text: string, searchTerm?: string) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-900/30 px-1 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  }; // <-- Properly close highlightSearchTerm function

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} variant="flat" className="animate-pulse p-6">
            <div className="flex items-center gap-3 mb-3">
              <Button loading size="sm" className="w-16 h-6" />
              <Button loading size="sm" className="w-48 h-6" />
            </div>
            <div className="space-y-2 mb-4">
              <Button loading size="sm" className="w-full h-4" />
              <Button loading size="sm" className="w-3/4 h-4" />
            </div>
            <div className="flex gap-4">
              <Button loading size="sm" className="w-24 h-4" />
              <Button loading size="sm" className="w-32 h-4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-card-foreground mb-2">
          Sonuç bulunamadı
        </h3>
        <p className="text-muted-foreground mb-4">
          {searchQuery
            ? `"${searchQuery}" için arama sonucu bulunamadı.`
            : 'Belirtilen kriterlere uygun sayfa bulunamadı.'}
        </p>
        <p className="text-sm text-muted-foreground">
          Farklı anahtar kelimeler deneyin veya filtreleri değiştirin.
        </p>
      </div>
    );
  }

  // Main results rendering block
  return (
    <div className="space-y-4">
      {results.map((result) => {
        const typeConfig =
          PAGE_TYPE_CONFIG[result.pageType as keyof typeof PAGE_TYPE_CONFIG];
        const Icon = typeConfig?.icon;
        const badgeColor =
          (typeConfig?.color as
            | 'blue'
            | 'green'
            | 'yellow'
            | 'red'
            | 'gray'
            | 'accent') || 'gray';
        return (
          <Card key={result.id} variant="default" className="p-6">
            <div className="flex items-center gap-3 mb-3">
              {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
              <Badge
                label={typeConfig?.label || result.pageType}
                color={badgeColor}
                className="text-xs px-2 py-1"
              />
              <Link
                href={`/pages/${result.id}`}
                className="font-semibold text-lg text-card-foreground hover:underline"
              >
                {highlightSearchTerm(result.title, searchQuery)}
              </Link>
            </div>
            <div className="mb-2 text-muted-foreground">
              {highlightSearchTerm(
                truncateContent(result.content || ''),
                searchQuery
              )}
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                {result.author?.name || 'Bilinmiyor'}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {formatDate(result.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <ChatBubbleLeftIcon className="h-4 w-4" />
                {result._count?.comments ?? result.comments?.length ?? 0} yorum
              </span>
              {(result._count?.files ?? result.files?.length ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <PaperClipIcon className="h-4 w-4" />
                  {result._count?.files ?? result.files?.length ?? 0} dosya
                </span>
              )}
            </div>
          </Card>
        );
      })}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            variant="outline"
            size="sm"
          >
            Önceki
          </Button>
          <div className="flex items-center gap-1">
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    variant={
                      pagination.page === pageNum ? 'default' : 'outline'
                    }
                    size="sm"
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              }
            )}
          </div>
          <Button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            variant="outline"
            size="sm"
          >
            Sonraki
          </Button>
        </div>
      )}
    </div>
  );
}
