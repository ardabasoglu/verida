import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCommentSchema } from '@/lib/validations';
import { z } from 'zod';
import { notifyNewComment } from '@/lib/notification-utils';

/**
 * POST /api/comments - Create a new comment
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

    // Validate request body
    const validatedData = createCommentSchema.parse(body);

    // Check if the page exists and is published
    const page = await prisma.page.findUnique({
      where: {
        id: validatedData.pageId,
        published: true,
      },
      select: {
        id: true,
        title: true,
        authorId: true,
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found or not published' },
        { status: 404 }
      );
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        pageId: validatedData.pageId,
        userId: session.user.id,
        comment: validatedData.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        page: {
          select: {
            id: true,
            title: true,
            authorId: true,
          },
        },
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_COMMENT',
        resourceType: 'Comment',
        resourceId: comment.id,
        details: {
          pageId: page.id,
          pageTitle: page.title,
          commentPreview: comment.comment.substring(0, 100),
        },
      },
    });

    // Send notification to page author
    try {
      await notifyNewComment(page.id, session.user.id);
    } catch (error) {
      console.error('Error sending comment notification:', error);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json(
      {
        success: true,
        data: comment,
        message: 'Comment created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);

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
 * GET /api/comments - Get comments with pagination
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

    const pageId = searchParams.get('pageId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!pageId) {
      return NextResponse.json(
        { error: 'pageId parameter is required' },
        { status: 400 }
      );
    }

    // Check if the page exists and is published
    const pageExists = await prisma.page.findUnique({
      where: {
        id: pageId,
        published: true,
      },
      select: { id: true },
    });

    if (!pageExists) {
      return NextResponse.json(
        { error: 'Page not found or not published' },
        { status: 404 }
      );
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.comment.count({
      where: { pageId },
    });

    // Fetch comments with user information
    const comments = await prisma.comment.findMany({
      where: { pageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
