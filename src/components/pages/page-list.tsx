'use client';
import { Badge } from '@/components/ui/badge';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ContentType } from '@prisma/client';
import { PageWithRelations } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PageListProps {
  initialPages?: PageWithRelations[];
  showFilters?: boolean;
  showCreateButton?: boolean;
}

const PAGE_TYPE_LABELS = {
  INFO: 'Bilgi',
  PROCEDURE: 'Prosedür',
  ANNOUNCEMENT: 'Duyuru',
  WARNING: 'Uyarı',
};

export default function PageList({
  initialPages = [],
  showFilters = true,
  showCreateButton = true,
}: PageListProps) {
  const [pages, setPages] = useState<PageWithRelations[]>(initialPages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    query: '',
    pageType: '' as ContentType | '',
    tags: [] as string[],
    page: 1,
    limit: 10,
    sortBy: 'date' as 'date' | 'title' | 'pageType' | 'author' | 'relevance',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();

      if (filters.query) searchParams.set('query', filters.query);
      if (filters.pageType) searchParams.set('pageType', filters.pageType);
      if (filters.tags.length > 0)
        searchParams.set('tags', filters.tags.join(','));
      searchParams.set('page', filters.page.toString());
      searchParams.set('limit', filters.limit.toString());
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      // Use the enhanced search API if there's a query, otherwise use the regular pages API
      const apiEndpoint = filters.query ? '/api/search' : '/api/pages';
      const response = await fetch(`${apiEndpoint}?${searchParams}`);

      if (!response.ok) {
        throw new Error('Sayfalar yüklenirken hata oluştu');
      }

      const result = await response.json();

      if (result.success) {
        setPages(result.data);
        setPagination(result.pagination);
      } else {
        throw new Error(result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      setError(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (initialPages.length === 0) {
      fetchPages();
    }
  }, [fetchPages, initialPages.length]);

  // Trigger search when filters change (but not on initial load if we have initial pages)
  useEffect(() => {
    if (initialPages.length > 0) {
      fetchPages();
    }
  }, [filters, fetchPages, initialPages.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
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

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="w-full">
      {/* Create Button */}
      {showCreateButton && (
        <div className="mb-6 flex justify-end">
          <Link href="/pages/create">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Yeni Sayfa Oluştur
            </Button>
          </Link>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtreler</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Query */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label
                    htmlFor="query"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Arama
                  </label>
                  <input
                    type="text"
                    id="query"
                    value={filters.query}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, query: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
                    placeholder="Başlık, içerik veya etiket ara..."
                  />
                </div>

                {/* Page Type Filter */}
                <div>
                  <label
                    htmlFor="pageType"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Sayfa Tipi
                  </label>
                  <Select
                    value={filters.pageType || 'all'}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        pageType: value === 'all' ? '' : (value as ContentType),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm Tipler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Tipler</SelectItem>
                      {Object.entries(PAGE_TYPE_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <label
                    htmlFor="sortBy"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Sıralama
                  </label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        sortBy: value as
                          | 'date'
                          | 'title'
                          | 'pageType'
                          | 'author'
                          | 'relevance',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sıralama seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Tarihe Göre</SelectItem>
                      <SelectItem value="title">Başlığa Göre</SelectItem>
                      <SelectItem value="pageType">Tipe Göre</SelectItem>
                      <SelectItem value="author">Yazara Göre</SelectItem>
                      {filters.query && (
                        <SelectItem value="relevance">İlgiye Göre</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div>
                  <label
                    htmlFor="sortOrder"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Yön
                  </label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        sortOrder: value as 'asc' | 'desc',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Yön seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Azalan</SelectItem>
                      <SelectItem value="asc">Artan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search and Reset Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Ara ve Filtrele
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    setFilters({
                      query: '',
                      pageType: '',
                      tags: [],
                      page: 1,
                      limit: 10,
                      sortBy: 'date',
                      sortOrder: 'desc',
                    })
                  }
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  Filtreleri Temizle
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-6">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Sayfalar yükleniyor...</p>
        </div>
      )}

      {/* Pages List */}
      {!loading && pages.length > 0 && (
        <div className="space-y-4">
          {pages.map((page) => (
            <Card key={page.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 mb-3">
                        <Link
                          href={`/pages/${page.id}`}
                          className="text-lg sm:text-xl font-semibold text-card-foreground hover:text-primary transition-colors break-words"
                        >
                          {page.title}
                        </Link>
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

                      {page.content && (
                        <div
                          className="text-muted-foreground mb-3 text-sm sm:text-base leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: truncateContent(page.content),
                          }}
                        />
                      )}

                      {/* Tags */}
                      {page.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {page.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2.5 py-1 text-xs rounded-md bg-accent/20 text-accent-foreground ring-1 ring-border font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="truncate">
                          Yazar: {page.author.name || page.author.email}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>{formatDate(page.createdAt)}</span>
                        {page._count && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <div className="flex items-center gap-2 sm:gap-4">
                              <span>{page._count.comments} yorum</span>
                              {page._count.files > 0 && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span>{page._count.files} dosya</span>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && pages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Henüz sayfa bulunmuyor.</p>
          {showCreateButton && (
            <Link href="/pages/create">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                İlk Sayfayı Oluştur
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && pages.length > 0 && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 p-4 bg-muted rounded-lg">
          {/* Page Info */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>
            {' - '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
            {' / '}
            <span className="font-medium">{pagination.total}</span>
            {' sayfa gösteriliyor'}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page <= 1}
              className="px-3 py-2 border border-input text-foreground rounded-md hover:bg-accent disabled:opacity-50 text-sm"
            >
              İlk
            </Button>

            <Button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-2 border border-input text-foreground rounded-md hover:bg-accent disabled:opacity-50 text-sm"
            >
              Önceki
            </Button>

            {/* Page Numbers */}
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
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm rounded-md ${
                        pagination.page === pageNum
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-input text-foreground hover:bg-accent'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                }
              )}
            </div>

            <Button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-2 border border-input text-foreground rounded-md hover:bg-accent disabled:opacity-50 text-sm"
            >
              Sonraki
            </Button>

            <Button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-2 border border-input text-foreground rounded-md hover:bg-accent disabled:opacity-50 text-sm"
            >
              Son
            </Button>
          </div>

          {/* Items per page */}
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="itemsPerPage" className="text-muted-foreground">
              Sayfa başına:
            </label>
            <Select
              value={filters.limit.toString()}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  limit: parseInt(value),
                  page: 1,
                }))
              }
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
