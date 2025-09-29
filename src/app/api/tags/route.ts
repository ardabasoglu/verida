import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SearchQueries } from '@/lib/query-optimizer';
import { z } from 'zod';

const tagSearchSchema = z.object({
  query: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * GET /api/tags - Get all tags with usage count and search functionality
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

    const queryParams = {
      query: searchParams.get('query') || undefined,
      limit: searchParams.get('limit') || '20',
    };

    const validatedParams = tagSearchSchema.parse(queryParams);

    // Use optimized query with caching
    const allTags = await SearchQueries.getTags();

    // Filter tags if query is provided
    let tags = allTags;
    if (validatedParams.query) {
      tags = allTags.filter(({ tag }) =>
        tag.toLowerCase().includes(validatedParams.query!.toLowerCase())
      );
    }

    // Apply limit
    tags = tags.slice(0, validatedParams.limit);

    return NextResponse.json({
      success: true,
      data: tags,
      total: tags.length,
    });
  } catch (error) {
    console.error('Error fetching tags:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.issues },
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
 * GET /api/tags/popular - Get most popular tags
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

    const body = await request.json();
    const { limit = 10 } = body;

    // Get all pages to extract tags
    const pages = await prisma.page.findMany({
      where: {
        published: true,
      },
      select: {
        tags: true,
      },
    });

    // Count tag usage
    const tagCounts = new Map<string, number>();

    pages.forEach((page) => {
      page.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Get most popular tags
    const popularTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: popularTags,
    });
  } catch (error) {
    console.error('Error fetching popular tags:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
