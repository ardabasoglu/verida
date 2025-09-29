'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { CommentWithUser } from '@/types';
import { Button } from '@/components/ui/button';

interface CommentItemProps {
  comment: CommentWithUser;
  pageAuthorId: string;
  onCommentUpdated: () => void;
  onCommentDeleted: () => void;
}

export default function CommentItem({
  comment,
  pageAuthorId,
  onCommentUpdated,
  onCommentDeleted,
}: CommentItemProps) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [editedComment, setEditedComment] = useState(comment.comment);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if current user can edit/delete this comment
  const canEdit =
    session?.user &&
    (comment.userId === session.user.id ||
      pageAuthorId === session.user.id ||
      ['ADMIN', 'SYSTEM_ADMIN'].includes(session.user.role));

  const handleEdit = async () => {
    if (!editedComment.trim()) {
      setError('Yorum boş olamaz');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: editedComment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Yorum güncellenirken bir hata oluştu');
      }

      setIsEditing(false);
      onCommentUpdated();
    } catch (error) {
      console.error('Error updating comment:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Yorum güncellenirken bir hata oluştu'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Yorum silinirken bir hata oluştu');
      }

      onCommentDeleted();
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Yorum silinirken bir hata oluştu'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedComment(comment.comment);
    setError('');
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return 'text-red-600 dark:text-red-400';
      case 'ADMIN':
        return 'text-purple-600 dark:text-purple-400';
      case 'EDITOR':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return 'Sistem Yöneticisi';
      case 'ADMIN':
        return 'Yönetici';
      case 'EDITOR':
        return 'Editör';
      case 'MEMBER':
        return 'Üye';
      default:
        return role;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {/* Comment Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
            {comment.user.name?.charAt(0).toUpperCase() ||
              comment.user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-card-foreground">
              {comment.user.name || comment.user.email}
            </p>
            <p className={`text-xs ${getRoleColor(comment.user.role)}`}>
              {getRoleLabel(comment.user.role)}
            </p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDate(comment.createdAt)}
        </div>
      </div>

      {/* Comment Content */}
      <div className="space-y-2">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
              rows={3}
              maxLength={1000}
              className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring resize-vertical bg-background text-foreground"
              disabled={isLoading}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {editedComment.length}/1000 karakter
              </span>
              {error && (
                <span className="text-xs text-destructive">{error}</span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-card-foreground whitespace-pre-wrap">
            {comment.comment}
          </p>
        )}
      </div>

      {/* Comment Actions */}
      {canEdit && (
        <div className="flex items-center space-x-2 pt-2 border-t border-border">
          {isEditing ? (
            <>
              <Button
                onClick={handleEdit}
                disabled={isLoading || !editedComment.trim()}
                size="sm"
                className="text-xs"
              >
                {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              <Button
                onClick={cancelEdit}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                İptal
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Düzenle
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              >
                {isLoading ? 'Siliniyor...' : 'Sil'}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
