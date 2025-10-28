'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ContentType } from '@prisma/client';
import { PageWithRelations } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface PageTypeConfig {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
}

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
    pageTypeConfig?: Record<string, PageTypeConfig>;
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
    pageTypeConfig,
}: PublishedPagesSectionProps) {
    const { data: session } = useSession();
    const [pages, setPages] = useState<PageWithRelations[]>(initialPages);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
    }, [filters, onFilteredCountChange]);

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
    }, [filters, fetchPages, isInitialLoad, onFilteredCountChange]);

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
        <div className="w-full min-h-[600px] relative">
            {/* Header */}
            <div className="mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Yayınlanan Sayfalar</h2>
                    <p className="text-muted-foreground">En son yayınlanan içerikleri keşfedin</p>
                </div>
            </div>

            {/* Compact Combined Filters */}
            <div className="mb-6 space-y-3 filter-section">
                {/* Page Type Quick Filters */}
                {pageTypeConfig && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground mr-2">Tür:</span>
                        <button
                            onClick={() => {
                                setFilters((prev) => ({ ...prev, pageType: '', page: 1 }));
                                if (onPageTypeChange) onPageTypeChange('');
                            }}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${!filters.pageType
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background hover:bg-muted border-border'
                                }`}
                        >
                            Tümü
                        </button>
                        {Object.entries(pageTypeConfig).map(([type, config]) => {
                            const Icon = config.icon;
                            const isSelected = filters.pageType === type;
                            return (
                                <button
                                    key={type}
                                    onClick={() => {
                                        const newPageType = type as ContentType;
                                        setFilters((prev) => ({ ...prev, pageType: newPageType, page: 1 }));
                                        if (onPageTypeChange) onPageTypeChange(newPageType);
                                    }}
                                    className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full border transition-colors ${isSelected
                                        ? `${config.bgColor} ${config.color} ${config.borderColor} border-2`
                                        : 'bg-background hover:bg-muted border-border'
                                        }`}
                                >
                                    <Icon className="h-3 w-3" />
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Search and Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                value={filters.query}
                                onChange={(e) =>
                                    setFilters((prev) => ({ ...prev, query: e.target.value }))
                                }
                                className="pl-10 h-9"
                                placeholder="Ara..."
                            />
                        </div>
                        <Button type="submit" size="sm" className="h-9">
                            Ara
                        </Button>
                    </form>

                    {/* Sort Controls */}
                    <div className="flex gap-2 dropdown-container">
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
                            <SelectTrigger className="w-32 h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                                position="popper"
                                sideOffset={4}
                                className="z-[100] max-h-[200px]"
                            >
                                <SelectItem value="date">Tarih</SelectItem>
                                <SelectItem value="title">Başlık</SelectItem>
                                <SelectItem value="pageType">Tür</SelectItem>
                                <SelectItem value="author">Yazar</SelectItem>
                                {filters.query && (
                                    <SelectItem value="relevance">İlgi</SelectItem>
                                )}
                            </SelectContent>
                        </Select>

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
                            <SelectTrigger className="w-20 h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                                position="popper"
                                sideOffset={4}
                                className="z-[100] max-h-[200px]"
                            >
                                <SelectItem value="desc">↓</SelectItem>
                                <SelectItem value="asc">↑</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Active Filters Indicator */}
                {(filters.query || filters.pageType) && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Aktif filtreler:</span>
                        {filters.pageType && pageTypeConfig && pageTypeConfig[filters.pageType] && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                                {pageTypeConfig[filters.pageType]?.label}
                            </span>
                        )}
                        {filters.query && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                                &quot;{filters.query}&quot;
                            </span>
                        )}
                        <button
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
                                if (onPageTypeChange) onPageTypeChange('');
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                            Temizle
                        </button>
                    </div>
                )}
            </div>

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
                                                href={
                                                    session?.user?.role && ['ADMIN', 'SYSTEM_ADMIN'].includes(session.user.role)
                                                        ? `/pages/${page.id}`
                                                        : `/view/${page.id}`
                                                }
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