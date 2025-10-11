import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { ActivityLogger, ActivityAction } from '@/lib/activity-logger';
import { SearchQueries } from '@/lib/query-optimizer';

// Enhanced search schema
const searchSchema = z.object({
  query: z.string().optional(),
  pageType: z.enum(['INFO', 'PROCEDURE', 'ANNOUNCEMENT', 'WARNING']).optional(),
  tags: z.array(z.string()).optional(),
  authorId: z.string().cuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  sortBy: z.enum(['relevance', 'date', 'title']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/search - Enhanced search with full-text search capabilities (Optimized)
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
      pageType: searchParams.get('pageType') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      authorId: searchParams.get('authorId') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      sortBy: searchParams.get('sortBy') || 'relevance',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const validatedParams = searchSchema.parse(queryParams);

    // Use optimized search with caching
    const result = await SearchQueries.search({
      ...validatedParams,
      sortOrder: validatedParams.sortOrder as 'asc' | 'desc',
    });

    // Log search activity (async, don't wait)
    ActivityLogger.log({
      userId: session.user.id,
      action: ActivityAction.SEARCH_PERFORMED,
      details: {
        query: validatedParams.query,
        pageType: validatedParams.pageType,
        tags: validatedParams.tags,
        resultsCount: result.pages.length,
        totalResults: result.pagination.total,
        sortBy: validatedParams.sortBy,
        sortOrder: validatedParams.sortOrder,
      },
    }).catch((error) => {
      console.error('Error logging search activity:', error);
    });

    return NextResponse.json({
      success: true,
      data: result.pages,
      pagination: result.pagination,
      searchParams: validatedParams,
    });
  } catch (error) {
    console.error('Error in search API:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
