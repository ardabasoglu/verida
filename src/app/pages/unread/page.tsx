import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canAccessUnreadPages } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

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

export default async function UnreadPagesPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/auth/signin');
    }

    // Check domain restriction
    if (!session.user.email?.endsWith('@dgmgumruk.com')) {
        redirect('/unauthorized');
    }

    // Check if user can access unread pages
    if (!canAccessUnreadPages(session)) {
        redirect('/unauthorized');
    }

    // Get all page IDs that the user has viewed (from activity logs)
    const viewedPageIds = await prisma.activityLog.findMany({
        where: {
            userId: session.user.id,
            action: 'PAGE_VIEWED',
            resourceType: 'PAGE',
            resourceId: {
                not: null,
            },
        },
        select: {
            resourceId: true,
        },
        distinct: ['resourceId'],
    });

    const viewedIds = viewedPageIds
        .map(log => log.resourceId)
        .filter((id): id is string => id !== null);

    // Get unread pages for the current user
    const unreadPages = await prisma.page.findMany({
        where: {
            published: true,
            id: {
                notIn: viewedIds,
            },
        },
        include: {
            author: {
                select: {
                    name: true,
                    email: true
                }
            },
            _count: {
                select: {
                    comments: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <EyeOff className="h-8 w-8 text-primary" />
                        Okunmamış Sayfalar
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Henüz okumadığınız yeni içerikler
                    </p>
                </div>
                <div className="text-sm text-muted-foreground">
                    <Badge
                        label={unreadPages.length.toString()}
                        color="red"
                    />
                </div>
            </div>

            {unreadPages.length === 0 ? (
                <div className="text-center py-12">
                    <EyeOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">Okunmamış sayfa bulunmuyor.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Tüm sayfalar okunmuş veya yayınlanmış sayfa bulunmuyor.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {unreadPages.map((page) => (
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
                                            href={
                                                session?.user?.role && ['ADMIN', 'SYSTEM_ADMIN'].includes(session.user.role)
                                                    ? `/pages/${page.id}`
                                                    : `/view/${page.id}`
                                            }
                                            className="block text-xl font-semibold text-card-foreground hover:text-primary transition-colors"
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
                                        <Link
                                            href={
                                                session?.user?.role && ['ADMIN', 'SYSTEM_ADMIN'].includes(session.user.role)
                                                    ? `/pages/${page.id}`
                                                    : `/view/${page.id}`
                                            }
                                        >
                                            <Button size="sm" className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                Oku
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}