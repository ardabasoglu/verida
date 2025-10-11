'use client';

import { useState, useEffect, useCallback } from 'react';
import { CommentWithUser } from '@/types';
import CommentItem from './comment-item';
import { Button } from '@/components/ui/button';

interface CommentListProps {
  pageId: string;
  pageAuthorId: string;
  refreshTrigger?: number;
}

interface CommentsResponse {
  success: boolean;
  data: CommentWithUser[];
  error?: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CommentList({
  pageId,
  pageAuthorId,
  refreshTrigger = 0,
}: CommentListProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchComments = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(
        `/api/comments?pageId=${pageId}&page=${page}&limit=${limit}`
      );
      const data: CommentsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Yorumlar yüklenirken bir hata oluştu');
      }

      setComments(data.data);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Yorumlar yüklenirken bir hata oluştu'
      );
    } finally {
      setIsLoading(false);
    }
  }, [pageId, limit]);

  // Fetch comments on mount and when refreshTrigger changes
  useEffect(() => {
    fetchComments(1);
  }, [pageId, refreshTrigger, fetchComments]);

  const handlePageChange = (page: number) => {
    fetchComments(page);
  };

  const handleCommentUpdated = () => {
    // Refresh current page
    fetchComments(currentPage);
  };

  const handleCommentDeleted = () => {
    // Refresh current page, or go to previous page if current page becomes empty
    const newTotal = total - 1;
    const newTotalPages = Math.ceil(newTotal / limit);

    if (currentPage > newTotalPages && newTotalPages > 0) {
      fetchComments(newTotalPages);
    } else {
      fetchComments(currentPage);
    }
  };

  if (isLoading && comments.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Yorumlar</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Yorumlar</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button
            onClick={() => fetchComments(currentPage)}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Yorumlar{' '}
          {total > 0 && <span className="text-muted-foreground">({total})</span>}
        </h3>
      </div>

      {comments.length === 0 ? (
        <div className="bg-muted border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Henüz yorum yapılmamış.</p>
          <p className="text-sm text-muted-foreground mt-1">İlk yorumu siz yapın!</p>
        </div>
      ) : (
        <>
          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                pageAuthorId={pageAuthorId}
                onCommentUpdated={handleCommentUpdated}
                onCommentDeleted={handleCommentDeleted}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-4">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
                variant="outline"
                size="sm"
              >
                Önceki
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                variant="outline"
                size="sm"
              >
                Sonraki
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
