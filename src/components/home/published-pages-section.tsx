'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ContentType } from '@prisma/client';
import { PageWithRelations } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Eye } from 'lucide-react';

interface PublishedPagesSectionProps {
    initialPages: PageWithRelations[];
    initialPagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    selectedPageType?: ContentType | '';
    onPageTypeChange?: (pageType: ContentType | '') => void;
    onFilteredCountChange?: (count: number) => void;
}

const PAGE_TYPE_LABELS = {
    INFO: 'Bilgi',
    PROCEDURE: 'Prosedür',
    ANNOUNCEMENT: 'Duyuru',
    WARNING: 'Uyarı',
};

const PAGE_TYPE_COLORS = {
    INFO: 'blue',
    PROCEDURE: 'green',
    ANNOUNCEMENT: 'yellow',
    WARNING: 'red',
} as const;

export default function PublishedPagesSection({
    initialPages,
    initialPagination,
    selectedPageType = '',
    onPageTypeChange,
    onFilteredCountChange,
}: PublishedPagesSectionProps) {
    const [pages, setPages] = useState<PageWithRelations[]>(initialPages);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        query: '',
        pageType: selectedPageType || ('' as ContentType | ''),
        page: 1,
        limit: 6, // Show 6 pages per page on home
        sortBy: 'date' as 'date' | 'title' | 'pageType' | 'author' | 'relevance',
        sortOrder: 'desc' as 'asc' | 'desc',
    });

    const [pagination, setPagination] = useState(
        initialPagination || {
            page: 1,
            limit: 6,
            total: initialPages.length,
            totalPages: Math.ceil(initialPages.length / 6),
        }
    );

    const fetchPages = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        // Add a small delay to prevent flickering on fast responses
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 150));

        try {
            const searchParams = new URLSearchParams();

            if (filters.query) searchParams.set('query', filters.query);
            if (filters.pageType) searchParams.set('pageType', filters.pageType);
            searchParams.set('page', filters.page.toString());
            searchParams.set('limit', filters.limit.toString());

            // Map sortBy values to API expected values
            const sortByMapping: Record<string, string> = {
                'date': 'createdAt',
                'title': 'title',
                'pageType': 'pageType',
                'author': 'author',
                'relevance': 'createdAt' // fallback for relevance when not using search API
            };
            searchParams.set('sortBy', sortByMapping[filters.sortBy] || 'createdAt');
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
                // Notify parent of filtered count
                if (onFilteredCountChange) {
                    onFilteredCountChange(result.pagination.total);
                }
            } else {
                throw new Error(result.error || 'Bir hata oluştu');
            }
        } catch (error) {
            console.error('Error fetching pages:', error);
            setError(error instanceof Error ? error.message : 'Bir hata oluştu');
        } finally {
            // Wait for minimum loading time to prevent flickering
            await minLoadingTime;
            setLoading(false);
        }
    }, [filters]);

    // Track if this is the initial load
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Update filters when selectedPageType changes from parent
    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            pageType: selectedPageType || '',
            page: 1, // Reset to first page when filter changes
        }));
    }, [selectedPageType]);

    // Trigger search when filters change (but not on initial load)
    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }

        // Always fetch when filters change after initial load
        fetchPages();
    }, [filters, fetchPages, isInitialLoad]);

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
        });
    };

    const stripHtmlTags = (html: string) => {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    };

    const truncateContent = (content: string, maxLength: number = 120) => {
        const plainText = stripHtmlTags(content);
        if (plainText.length <= maxLength) return plainText;
        return plainText.substring(0, maxLength) + '...';
    };

    return (
        <div className="w-full min-h-[600px]">
            {/* Header with Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Yayınlanan Sayfalar</h2>
                    <p className="text-muted-foreground">En son yayınlanan içerikleri keşfedin</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowFilters(!showFilters)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        Filtreler
                    </Button>
                    <Link href="/pages">
                        <Button size="sm" className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Tümünü Gör
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Search */}
            <Card className="mb-6">
                <CardContent className="pt-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                value={filters.query}
                                onChange={(e) =>
                                    setFilters((prev) => ({ ...prev, query: e.target.value }))
                                }
                                className="pl-10"
                                placeholder="Başlık, içerik veya etiket ara..."
                            />
                        </div>
                        <Button type="submit" size="sm">
                            Ara
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Advanced Filters */}
            {showFilters && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Gelişmiş Filtreler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Page Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Sayfa Tipi
                                </label>
                                <Select
                                    value={filters.pageType || 'all'}
                                    onValueChange={(value) => {
                                        const newPageType = value === 'all' ? '' : (value as ContentType);
                                        setFilters((prev) => ({
                                            ...prev,
                                            pageType: newPageType,
                                            page: 1,
                                        }));
                                        // Notify parent component of the change
                                        if (onPageTypeChange) {
                                            onPageTypeChange(newPageType);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tüm Tipler" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tüm Tipler</SelectItem>
                                        {Object.entries(PAGE_TYPE_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Sıralama
                                </label>
                                <Select
                                    value={filters.sortBy}
                                    onValueChange={(value) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            sortBy: value as typeof filters.sortBy,
                                            page: 1,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
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
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Yön
                                </label>
                                <Select
                                    value={filters.sortOrder}
                                    onValueChange={(value) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            sortOrder: value as 'asc' | 'desc',
                                            page: 1,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="desc">Yeniden Eskiye</SelectItem>
                                        <SelectItem value="asc">Eskiden Yeniye</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Button
                                type="button"
                                onClick={() => {
                                    setFilters({
                                        query: '',
                                        pageType: '',
                                        page: 1,
                                        limit: 6,
                                        sortBy: 'date',
                                        sortOrder: 'desc',
                                    });
                                    setPages(initialPages);
                                    setPagination(
                                        initialPagination || {
                                            page: 1,
                                            limit: 6,
                                            total: initialPages.length,
                                            totalPages: Math.ceil(initialPages.length / 6),
                                        }
                                    );
                                    // Notify parent component to clear the filter
                                    if (onPageTypeChange) {
                                        onPageTypeChange('');
                                    }
                                }}
                                variant="outline"
                                size="sm"
                            >
                                Filtreleri Temizle
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-6">
                    <p className="text-destructive">{error}</p>
                </div>
            )}

            {/* Content Area with Consistent Height */}
            <div className="relative min-h-[500px]">
                {/* Loading State */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                        <div className="space-y-4 text-center">
                            <div className="spinner w-8 h-8 mx-auto"></div>
                            <p className="text-muted-foreground">Sayfalar yükleniyor...</p>
                        </div>
                    </div>
                )}

                {/* Pages Grid */}
                {pages.length > 0 && (
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 filter-transition ${loading ? 'loading' : ''}`}>
                        {pages.map((page) => (
                            <Card key={page.id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {/* Header */}
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <Badge
                                                    label={PAGE_TYPE_LABELS[page.pageType]}
                                                    color={PAGE_TYPE_COLORS[page.pageType]}
                                                />
                                            </div>
                                            <Link
                                                href={`/pages/${page.id}`}
                                                className="block text-lg font-semibold text-card-foreground hover:text-primary transition-colors"
                                                style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {page.title}
                                            </Link>
                                        </div>

                                        {/* Content Preview */}
                                        {page.content && (
                                            <p
                                                className="text-muted-foreground text-sm leading-relaxed"
                                                style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {truncateContent(page.content)}
                                            </p>
                                        )}

                                        {/* Tags */}
                                        {page.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {page.tags.slice(0, 3).map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 text-xs rounded-md bg-accent/20 text-accent-foreground ring-1 ring-border"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                                {page.tags.length > 3 && (
                                                    <span className="px-2 py-1 text-xs text-muted-foreground">
                                                        +{page.tags.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Meta Info */}
                                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                            <span className="truncate">
                                                {page.author.name || page.author.email}
                                            </span>
                                            <span>{formatDate(page.createdAt)}</span>
                                        </div>

                                        {/* Stats */}
                                        {page._count && (
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>{page._count.comments} yorum</span>
                                                {page._count.files > 0 && (
                                                    <span>{page._count.files} dosya</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && pages.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="space-y-4 text-center">
                            <p className="text-muted-foreground mb-4">
                                {filters.query || filters.pageType
                                    ? 'Arama kriterlerinize uygun sayfa bulunamadı.'
                                    : 'Henüz yayınlanmış sayfa bulunmuyor.'}
                            </p>
                            <Link href="/pages/create">
                                <Button>İlk Sayfayı Oluştur</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && pages.length > 0 && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                    <Button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        variant="outline"
                        size="sm"
                    >
                        Önceki
                    </Button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
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
                                    variant={pagination.page === pageNum ? "default" : "outline"}
                                    size="sm"
                                    className="w-8 h-8 p-0"
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        onClick={() => handlePageChange(pagination.page + 1)}
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