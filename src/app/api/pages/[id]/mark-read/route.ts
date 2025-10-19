import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ActivityLogger, ActivityAction, ResourceType } from '@/lib/activity-logger';
import { ApiResponse } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: pageId } = await params;

    // Verify the page exists
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true, title: true },
    });

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Sayfa bulunamadı' },
        { status: 404 }
      );
    }

    // Check if the user has already viewed this page
    const existingView = await prisma.activityLog.findFirst({
      where: {
        userId: userId,
        action: 'PAGE_VIEWED',
        resourceType: 'PAGE',
        resourceId: pageId,
      },
    });

    if (!existingView) {
      // Log the page view activity
      await ActivityLogger.log({
        userId,
        action: ActivityAction.PAGE_VIEWED,
        resourceType: ResourceType.PAGE,
        resourceId: pageId,
        details: {
          pageTitle: page.title,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Sayfa okundu olarak işaretlendi',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error marking page as read:', error);
    
    const response: ApiResponse = {
      success: false,
      error: 'Sayfa işaretlenirken hata oluştu',
    };

    return NextResponse.json(response, { status: 500 });
  }
}