import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/types';
import { PageWithRelations } from '@/types';
import { canAccessUnreadPages } from '@/lib/auth-utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check role-based access - ADMIN, SYSTEM_ADMIN, EDITOR, and MEMBER can access unread pages
    if (!canAccessUnreadPages(session)) {
      return NextResponse.json(
        { success: false, error: 'Access denied to view unread pages' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Get all page IDs that the user has viewed (from activity logs)
    const viewedPageIds = await prisma.activityLog.findMany({
      where: {
        userId: userId,
        action: 'PAGE_VIEWED',
        resourceType: 'PAGE',
        resourceId: {
          not: null,
        },
      },
      select: {
        resourceId: true,
      },
      distinct: ['resourceId'],
    });

    const viewedIds = viewedPageIds
      .map(log => log.resourceId)
      .filter((id): id is string => id !== null);

    // Get all published pages that the user hasn't viewed
    const unreadPages = await prisma.page.findMany({
      where: {
        published: true,
        id: {
          notIn: viewedIds,
        },
        // Optionally exclude pages authored by the user themselves
        // authorId: {
        //   not: userId,
        // },
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        files: {
          select: {
            id: true,
            createdAt: true,
            filename: true,
            mimeType: true,
            originalName: true,
            fileSize: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            files: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response: ApiResponse<PageWithRelations[]> = {
      success: true,
      data: unreadPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching unread pages:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Okunmamış sayfalar yüklenirken hata oluştu',
    };

    return NextResponse.json(response, { status: 500 });
  }
}