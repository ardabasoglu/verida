'use client'

import { useState } from 'react'
import CommentForm from './comment-form'
import CommentList from './comment-list'

interface CommentSectionProps {
  pageId: string
  pageAuthorId: string
  initialCommentCount?: number
}

export default function CommentSection({ 
  pageId, 
  pageAuthorId, 
  initialCommentCount = 0 
}: CommentSectionProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCommentAdded = () => {
    // Trigger refresh of comment list
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <div className="bg-muted border border-border rounded-lg p-4">
        <CommentForm
          pageId={pageId}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {/* Comments List */}
      <CommentList
        pageId={pageId}
        pageAuthorId={pageAuthorId}
        refreshTrigger={refreshTrigger}
      />
    </div>
  )
}