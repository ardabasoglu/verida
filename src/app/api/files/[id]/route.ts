import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  fileExists, 
  deleteFileFromDisk 
} from '@/lib/file-utils'
import { serveFileWithCache } from '@/lib/file-cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: fileId } = await params

    // Get file metadata from database
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        filePath: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    // Check if file exists on disk
    if (!fileExists(file.filePath)) {
      return NextResponse.json(
        { success: false, error: 'Dosya disk üzerinde bulunamadı' },
        { status: 404 }
      )
    }

    // Check if download is requested
    const { searchParams } = new URL(request.url)
    const download = searchParams.get('download') === 'true'

    // Use optimized file serving with caching
    return serveFileWithCache(
      request,
      file.filePath,
      file.mimeType || 'application/octet-stream',
      file.originalName,
      download
    )

  } catch (error) {
    console.error('File serve error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: fileId } = await params

    // Get file metadata from database
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        filePath: true,
        uploadedById: true,
      }
    })

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    // Check permissions - only file owner, admins, or system admins can delete
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const canDelete = file.uploadedById === session.user.id || 
                     ['ADMIN', 'SYSTEM_ADMIN'].includes(user?.role || '')

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Delete file from database
    await prisma.file.delete({
      where: { id: fileId }
    })

    // Delete file from disk
    try {
      await deleteFileFromDisk(file.filePath)
    } catch (diskError) {
      console.error('Error deleting file from disk:', diskError)
      // Continue even if disk deletion fails - database record is already deleted
    }

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_FILE',
        resourceType: 'File',
        resourceId: fileId,
        details: {
          filename: file.filePath,
          originalName: 'Unknown'
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('File delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}