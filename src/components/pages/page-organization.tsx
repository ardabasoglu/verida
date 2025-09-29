'use client';

import { useState } from 'react';
import { ContentType } from '@prisma/client';
import { PageWithRelations } from '@/types';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PageOrganizationProps {
  pages: PageWithRelations[];
  onPageSelect?: (pageId: string) => void;
  className?: string;
}

const PAGE_TYPE_CONFIG = {
  INFO: {
    label: 'Bilgi',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    icon: '📚',
  },
  PROCEDURE: {
    label: 'Prosedür',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    icon: '⚙️',
  },
  ANNOUNCEMENT: {
    label: 'Duyuru',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: '📢',
  },
  WARNING: {
    label: 'Uyarı',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    icon: '⚠️',
  },
};

export function PageOrganization({
  pages,
  onPageSelect,
  className = '',
}: PageOrganizationProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<ContentType>>(
    new Set(['ANNOUNCEMENT', 'WARNING'])
  );

  // Group pages by type
  const pagesByType = pages.reduce(
    (acc, page) => {
      if (!acc[page.pageType]) {
        acc[page.pageType] = [];
      }
      acc[page.pageType].push(page);
      return acc;
    },
    {} as Record<ContentType, PageWithRelations[]>
  );

  const toggleTypeExpansion = (type: ContentType) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Sayfa Organizasyonu
      </h3>

      {Object.entries(PAGE_TYPE_CONFIG).map(([type, config]) => {
        const typedType = type as ContentType;
        const pagesOfType = pagesByType[typedType] || [];
        const isExpanded = expandedTypes.has(typedType);

        if (pagesOfType.length === 0) return null;

        return (
          <div
            key={type}
            className="border border-border rounded-lg overflow-hidden"
          >
            {/* Type Header */}
            <button
              onClick={() => toggleTypeExpansion(typedType)}
              className={`w-full px-4 py-3 ${config.bgColor} ${config.color} flex items-center justify-between hover:opacity-80 transition-opacity`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{config.icon}</span>
                <span className="font-medium">{config.label}</span>
                <span className="text-sm opacity-75">
                  ({pagesOfType.length})
                </span>
              </div>
              {isExpanded ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </button>

            {/* Pages List */}
            {isExpanded && (
              <div className="bg-card">
                {pagesOfType.slice(0, 10).map((page, index) => (
                  <div
                    key={page.id}
                    className={`px-4 py-3 border-t border-border hover:bg-muted cursor-pointer transition-colors ${
                      index === 0 ? 'border-t-0' : ''
                    }`}
                    onClick={() => onPageSelect?.(page.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {page.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{page.author.name || page.author.email}</span>
                          <span>•</span>
                          <span>{formatDate(page.createdAt)}</span>
                          {page._count && page._count.comments > 0 && (
                            <>
                              <span>•</span>
                              <span>{page._count.comments} yorum</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {pagesOfType.length > 10 && (
                  <div className="px-4 py-3 border-t border-border text-center">
                    <span className="text-sm text-muted-foreground">
                      +{pagesOfType.length - 10} sayfa daha...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {Object.keys(pagesByType).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Henüz sayfa bulunmuyor.</p>
        </div>
      )}
    </div>
  );
}
