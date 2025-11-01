import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updatePageSchema } from '@/lib/validations';
import { z } from 'zod';
import { notifyPageUpdate } from '@/lib/notification-utils';
import {
  ActivityLogger,
  ActivityAction,
  ResourceType,
} from '@/lib/activity-logger';
import { PageQueries } from '@/lib/query-optimizer';
import { CacheInvalidation } from '@/lib/cache';
import { canAccessPagesManagement, canViewPublishedPages } from '@/lib/auth-utils';

/**
 * GET /api/pages/[id] - Get a single page by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check role-based access - all authenticated users can view published pages
    if (!canViewPublishedPages(session)) {
      return NextResponse.json(
        { error: 'Access denied to view pages' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid page ID' }, { status: 400 });
    }

    // Use optimized query with caching
    const page = await PageQueries.getById(id);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Only show published pages (unless user is author or admin)
    if (
      !page.published &&
      page.authorId !== session.user.id &&
      !['ADMIN', 'SYSTEM_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Log page view activity
    await ActivityLogger.log({
      userId: session.user.id,
      action: ActivityAction.PAGE_VIEWED,
      resourceType: ResourceType.PAGE,
      resourceId: page.id,
      details: {
        title: page.title,
        pageType: page.pageType,
        isAuthor: page.authorId === session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pages/[id] - Update a page
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid page ID' }, { status: 400 });
    }

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        title: true,
        pageType: true,
      },
    });

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Check permissions - author, editor, admin, or system admin can edit pages
    const canEdit =
      existingPage.authorId === session.user.id ||
      ['EDITOR', 'ADMIN', 'SYSTEM_ADMIN'].includes(session.user.role);

    if (!canEdit) {
      return NextResponse.json(
        {
          error: 'You do not have permission to edit this page.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = updatePageSchema.parse(body);

    // Validate file IDs if provided
    if (validatedData.fileIds && validatedData.fileIds.length > 0) {
      const existingFiles = await prisma.file.findMany({
        where: {
          id: { in: validatedData.fileIds },
          uploadedById: session.user.id, // Only allow attaching own files
        },
        select: { id: true },
      });

      if (existingFiles.length !== validatedData.fileIds.length) {
        return NextResponse.json(
          { error: 'Some files not found or not owned by user' },
          { status: 400 }
        );
      }
    }

    // Handle file attachments update
    if (validatedData.fileIds !== undefined) {
      // First, disconnect all current files
      await prisma.file.updateMany({
        where: { pageId: id },
        data: { pageId: null },
      });

      // Then connect new files if any
      if (validatedData.fileIds.length > 0) {
        await prisma.file.updateMany({
          where: {
            id: { in: validatedData.fileIds },
          },
          data: {
            pageId: id,
          },
        });
      }
    }

    // Update page (no versioning as per requirements)
    const updatedPage = await prisma.page.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.content !== undefined && {
          content: validatedData.content,
        }),
        ...(validatedData.pageType && { pageType: validatedData.pageType }),
        ...(validatedData.tags && { tags: validatedData.tags }),
        ...(validatedData.published !== undefined && {
          published: validatedData.published,
        }),
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        files: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            comments: true,
            files: true,
          },
        },
      },
    });

    // Invalidate caches
    CacheInvalidation.page(id);
    CacheInvalidation.search();
    CacheInvalidation.stats();

    // Log the activity
    await ActivityLogger.log({
      userId: session.user.id,
      action: ActivityAction.PAGE_UPDATED,
      resourceType: ResourceType.PAGE,
      resourceId: updatedPage.id,
      details: {
        title: updatedPage.title,
        pageType: updatedPage.pageType,
        changes: validatedData,
        filesAttached: validatedData.fileIds?.length || 0,
      },
    });

    // Send notifications for page updates (announcements and warnings only)
    try {
      await notifyPageUpdate(updatedPage.id, session.user.id);
    } catch (error) {
      console.error('Error sending update notifications:', error);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      data: updatedPage,
      message: 'Page updated successfully',
    });
  } catch (error) {
    console.error('Error updating page:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pages/[id] - Delete a page
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid page ID' }, { status: 400 });
    }

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        title: true,
        pageType: true,
      },
    });

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Check permissions - only admin or system admin can delete pages
    if (!canAccessPagesManagement(session)) {
      return NextResponse.json(
        {
          error: 'Admin access required to delete pages.',
        },
        { status: 403 }
      );
    }

    // Delete the page (this will cascade delete comments and file relations)
    await prisma.page.delete({
      where: { id },
    });

    // Invalidate caches
    CacheInvalidation.page(id);
    CacheInvalidation.search();
    CacheInvalidation.stats();

    // Log the activity
    await ActivityLogger.log({
      userId: session.user.id,
      action: ActivityAction.PAGE_DELETED,
      resourceType: ResourceType.PAGE,
      resourceId: id,
      details: {
        title: existingPage.title,
        pageType: existingPage.pageType,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
