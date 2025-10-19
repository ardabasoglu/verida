'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageWithRelations } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';

interface PageTypeConfig {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
}

interface UnreadPagesSectionProps {
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

export default function UnreadPagesSection({}: UnreadPagesSectionProps) {
    const [unreadPages, setUnreadPages] = useState<PageWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    const fetchUnreadPages = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/pages/unread');
            
            if (!response.ok) {
                throw new Error('Okunmamış sayfalar yüklenirken hata oluştu');
            }

            const result = await response.json();

            if (result.success) {
                setUnreadPages(result.data);
            } else {
                throw new Error(result.error || 'Bir hata oluştu');
            }
        } catch (error) {
            console.error('Error fetching unread pages:', error);
            setError(error instanceof Error ? error.message : 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUnreadPages();
    }, [fetchUnreadPages]);

    const markAsRead = async (pageId: string) => {
        try {
            const response = await fetch(`/api/pages/${pageId}/mark-read`, {
                method: 'POST',
            });

            if (response.ok) {
                // Remove the page from unread list
                setUnreadPages(prev => prev.filter(page => page.id !== pageId));
            }
        } catch (error) {
            console.error('Error marking page as read:', error);
        }
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

    // Show only first 3 pages by default, or all if showAll is true
    const displayedPages = showAll ? unreadPages : unreadPages.slice(0, 3);

    if (loading) {
        return (
            <div className="w-full mb-8">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-foreground">Okunmamış Sayfalar</h2>
                    <p className="text-muted-foreground">Henüz okumadığınız yeni içerikler</p>
                </div>
                <div className="flex items-center justify-center py-8">
                    <div className="spinner w-6 h-6"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full mb-8">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-foreground">Okunmamış Sayfalar</h2>
                    <p className="text-muted-foreground">Henüz okumadığınız yeni içerikler</p>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                    <p className="text-destructive">{error}</p>
                </div>
            </div>
        );
    }

    if (unreadPages.length === 0) {
        return null; // Don't show the section if there are no unread pages
    }

    return (
        <div className="w-full mb-8">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <EyeOff className="h-6 w-6 text-primary" />
                        Okunmamış Sayfalar
                        <Badge 
                            label={unreadPages.length.toString()} 
                            color="red" 
                            className="ml-2"
                        />
                    </h2>
                    <p className="text-muted-foreground">Henüz okumadığınız yeni içerikler</p>
                </div>
                {unreadPages.length > 3 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAll(!showAll)}
                    >
                        {showAll ? 'Daha Az Göster' : `Tümünü Göster (${unreadPages.length})`}
                    </Button>
                )}
            </div>

            {/* Unread Pages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedPages.map((page) => (
                    <Card key={page.id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-primary">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <Badge
                                            label={PAGE_TYPE_LABELS[page.pageType]}
                                            color={PAGE_TYPE_COLORS[page.pageType]}
                                        />
                                        <div className="flex items-center gap-1">
                                            <EyeOff className="h-4 w-4 text-primary" />
                                            <span className="text-xs text-primary font-medium">Yeni</span>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/pages/${page.id}`}
                                        onClick={() => markAsRead(page.id)}
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

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2">
                                    <Link href={`/pages/${page.id}`} onClick={() => markAsRead(page.id)}>
                                        <Button size="sm" className="flex items-center gap-1">
                                            <Eye className="h-3 w-3" />
                                            Oku
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => markAsRead(page.id)}
                                        className="flex items-center gap-1"
                                    >
                                        <Eye className="h-3 w-3" />
                                        Okundu İşaretle
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}