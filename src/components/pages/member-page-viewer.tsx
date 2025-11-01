'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { PageWithRelations } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, MessageCircle, Paperclip, Edit } from 'lucide-react';
import FileAttachments from '@/components/files/file-attachments';
import CommentSection from '@/components/comments/comment-section';
import DOMPurify from 'dompurify';

interface MemberPageViewerProps {
    page: PageWithRelations;
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

export default function MemberPageViewer({ page }: MemberPageViewerProps) {
    const { data: session } = useSession();
    const [isClient, setIsClient] = useState(false);

    // Check if user can edit this page
    const canEdit = useMemo(() => {
        if (!session?.user) return false;
        return (
            page.authorId === session.user.id ||
            ['ADMIN', 'SYSTEM_ADMIN', 'EDITOR'].includes(session.user.role)
        );
    }, [session?.user, page.authorId]);

    useEffect(() => {
        setIsClient(true);

        // Log page view when component mounts
        const logPageView = async () => {
            if (session?.user?.id) {
                try {
                    await fetch(`/api/pages/${page.id}/mark-read`, {
                        method: 'POST',
                    });
                } catch (error) {
                    console.error('Error logging page view:', error);
                }
            }
        };

        logPageView();
    }, [page.id, session?.user?.id]);

    // Sanitize HTML content
    const sanitizedContent = useMemo(() => {
        if (!page.content || !isClient) return page.content || '';

        return DOMPurify.sanitize(page.content, {
            ALLOWED_TAGS: [
                'p', 'br', 'strong', 'em', 'u', 's',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li', 'blockquote', 'a', 'img',
                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'div', 'span', 'iframe', 'hr',
            ],
            ALLOWED_ATTR: [
                'href', 'src', 'alt', 'title', 'class',
                'width', 'height', 'frameborder', 'allowfullscreen', 'allow',
            ],
            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        });
    }, [page.content, isClient]);

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
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
            {/* Navigation and Actions */}
            <div className="flex items-center justify-between">
                <Link href="/">
                    <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Ana Sayfaya Dön
                    </Button>
                </Link>

                {canEdit && (
                    <Link href={`/view/${page.id}/edit`}>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Düzenle
                        </Button>
                    </Link>
                )}
            </div>

            {/* Page Header */}
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <Badge
                        label={PAGE_TYPE_LABELS[page.pageType]}
                        color={PAGE_TYPE_COLORS[page.pageType]}
                    />
                </div>

                <h1 className="text-3xl font-bold text-foreground leading-tight">
                    {page.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{page.author.name || page.author.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(page.createdAt)}</span>
                    </div>
                    {page.updatedAt !== page.createdAt && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Güncelleme: {formatDate(page.updatedAt)}</span>
                        </div>
                    )}
                    {page._count && (
                        <>
                            <div className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />
                                <span>{page._count.comments} yorum</span>
                            </div>
                            {page._count.files > 0 && (
                                <div className="flex items-center gap-1">
                                    <Paperclip className="h-4 w-4" />
                                    <span>{page._count.files} dosya</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Tags */}
                {page.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
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

            {/* Content */}
            <div className="bg-card rounded-lg shadow-sm border p-8">
                <div className="prose prose-lg max-w-none">
                    {sanitizedContent ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                            className="text-foreground leading-relaxed"
                        />
                    ) : (
                        <p className="text-muted-foreground italic text-center py-8">
                            Bu sayfada henüz içerik bulunmuyor.
                        </p>
                    )}
                </div>
            </div>

            {/* Files */}
            {page.files && page.files.length > 0 && (
                <div className="bg-card rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Paperclip className="h-5 w-5" />
                        Ekli Dosyalar
                    </h3>
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
            <div className="bg-card rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Yorumlar
                </h3>
                <CommentSection
                    pageId={page.id}
                    pageAuthorId={page.authorId}
                    initialCommentCount={page.comments?.length || 0}
                />
            </div>
        </div>
    );
}