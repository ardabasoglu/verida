import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCommentSchema = z.object({
  comment: z.string().min(1, 'Yorum boş olamaz').max(1000, 'Yorum çok uzun')
})

/**
 * GET /api/comments/[id] - Get a specific comment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        page: {
          select: {
            id: true,
            title: true,
            authorId: true,
            published: true
          }
        }
      }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if page is published
    if (!comment.page.published) {
      return NextResponse.json(
        { error: 'Page not published' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: comment
    })

  } catch (error) {
    console.error('Error fetching comment:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/comments/[id] - Update a comment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    
    // Validate request body
    const validatedData = updateCommentSchema.parse(body)

    // Find the comment and check ownership
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: {
        page: {
          select: {
            id: true,
            title: true,
            authorId: true,
            published: true
          }
        }
      }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if page is published
    if (!existingComment.page.published) {
      return NextResponse.json(
        { error: 'Cannot edit comment on unpublished page' },
        { status: 400 }
      )
    }

    // Check permissions: user can edit their own comments, or admins/page authors can edit any comment
    const canEdit = existingComment.userId === session.user.id ||
                   existingComment.page.authorId === session.user.id ||
                   ['ADMIN', 'SYSTEM_ADMIN'].includes(session.user.role)

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Permission denied. You can only edit your own comments.' },
        { status: 403 }
      )
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        comment: validatedData.comment
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        page: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_COMMENT',
        resourceType: 'Comment',
        resourceId: updatedComment.id,
        details: {
          pageId: updatedComment.page.id,
          pageTitle: updatedComment.page.title,
          commentPreview: updatedComment.comment.substring(0, 100)
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedComment,
      message: 'Comment updated successfully'
    })

  } catch (error) {
    console.error('Error updating comment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/comments/[id] - Delete a comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    // Find the comment and check ownership
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: {
        page: {
          select: {
            id: true,
            title: true,
            authorId: true
          }
        }
      }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check permissions: user can delete their own comments, or admins/page authors can delete any comment
    const canDelete = existingComment.userId === session.user.id ||
                     existingComment.page.authorId === session.user.id ||
                     ['ADMIN', 'SYSTEM_ADMIN'].includes(session.user.role)

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Permission denied. You can only delete your own comments.' },
        { status: 403 }
      )
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id }
    })

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_COMMENT',
        resourceType: 'Comment',
        resourceId: id,
        details: {
          pageId: existingComment.page.id,
          pageTitle: existingComment.page.title,
          commentPreview: existingComment.comment.substring(0, 100)
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting comment:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}