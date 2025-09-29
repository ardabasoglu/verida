import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPageSchema, searchPageSchema } from '@/lib/validations';
import { ContentType } from '@prisma/client';
import { z } from 'zod';
import {
  notifyNewAnnouncement,
  notifyNewWarning,
} from '@/lib/notification-utils';
import {
  ActivityLogger,
  ActivityAction,
  ResourceType,
} from '@/lib/activity-logger';
import { getRequestMetadata } from '@/lib/request-utils';
import { PageQueries } from '@/lib/query-optimizer';
import { CacheInvalidation } from '@/lib/cache';

/**
 * GET /api/pages - List pages with filtering and pagination (Optimized)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = {
      query: searchParams.get('query') || undefined,
      pageType: (searchParams.get('pageType') as ContentType) || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      authorId: searchParams.get('authorId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    // Enhanced validation schema for pages API
    const enhancedSearchPageSchema = searchPageSchema.extend({
      sortBy: z
        .enum(['createdAt', 'title', 'pageType', 'author', 'date'])
        .default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    });

    const validatedParams = enhancedSearchPageSchema.parse(queryParams);

    // Use optimized query with caching
    const result = await PageQueries.getList(validatedParams);

    return NextResponse.json({
      success: true,
      data: result.pages,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching pages:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
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
 * POST /api/pages - Create a new page
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has editor role or higher
    const userRole = session.user.role;
    if (!['EDITOR', 'ADMIN', 'SYSTEM_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Editor role or higher required to create pages' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = createPageSchema.parse(body);

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

    // Create page with instant publishing (no approval needed)
    const page = await prisma.page.create({
      data: {
        title: validatedData.title,
        content: validatedData.content || '',
        pageType: validatedData.pageType,
        tags: validatedData.tags,
        published: true, // Instant publishing as per requirements
        authorId: session.user.id,
        // Connect files if provided
        ...(validatedData.fileIds &&
          validatedData.fileIds.length > 0 && {
            files: {
              connect: validatedData.fileIds.map((id) => ({ id })),
            },
          }),
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

    // Update file records to associate them with the page
    if (validatedData.fileIds && validatedData.fileIds.length > 0) {
      await prisma.file.updateMany({
        where: {
          id: { in: validatedData.fileIds },
        },
        data: {
          pageId: page.id,
        },
      });
    }

    // Log the activity
    const requestMetadata = getRequestMetadata(request);
    await ActivityLogger.log({
      userId: session.user.id,
      action: ActivityAction.PAGE_CREATED,
      resourceType: ResourceType.PAGE,
      resourceId: page.id,
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
      details: {
        title: page.title,
        pageType: page.pageType,
        tagsCount: validatedData.tags?.length || 0,
        filesAttached: validatedData.fileIds?.length || 0,
      },
    });

    // Invalidate relevant caches
    CacheInvalidation.page(page.id);
    CacheInvalidation.search();
    CacheInvalidation.stats();

    // Send notifications for announcements and warnings
    try {
      if (page.pageType === 'ANNOUNCEMENT') {
        await notifyNewAnnouncement(page.id, session.user.id);
      } else if (page.pageType === 'WARNING') {
        await notifyNewWarning(page.id, session.user.id);
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json(
      {
        success: true,
        data: page,
        message: 'Page created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating page:', error);

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
