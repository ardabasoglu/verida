'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

interface CommentFormProps {
  pageId: string
  onCommentAdded: () => void
  isSubmitting?: boolean
}

export default function CommentForm({ pageId, onCommentAdded, isSubmitting = false }: CommentFormProps) {
  const { data: session } = useSession()
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!comment.trim()) {
      setError('Yorum boş olamaz')
      return
    }

    if (!session?.user) {
      setError('Yorum yapmak için giriş yapmalısınız')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId,
          comment: comment.trim()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Yorum eklenirken bir hata oluştu')
      }

      // Clear form and notify parent
      setComment('')
      onCommentAdded()
      
    } catch (error) {
      console.error('Error adding comment:', error)
      setError(error instanceof Error ? error.message : 'Yorum eklenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="bg-muted p-4 rounded-lg text-center">
        <p className="text-muted-foreground">Yorum yapmak için giriş yapmalısınız.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
          Yorum Ekle
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Yorumunuzu buraya yazın..."
          rows={4}
          maxLength={1000}
          className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
          disabled={isLoading || isSubmitting}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-muted-foreground">
            {comment.length}/1000 karakter
          </span>
          {error && (
            <span className="text-xs text-red-600">{error}</span>
          )}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading || isSubmitting || !comment.trim()}
          className="px-4 py-2"
        >
          {isLoading ? 'Gönderiliyor...' : 'Yorum Ekle'}
        </Button>
      </div>
    </form>
  )
}