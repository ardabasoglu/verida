import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActivityLogger, ActivityAction } from '@/lib/activity-logger';

import { logger } from '@/lib/logger';
import { canAccessAdminRoutes } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Users can view their own activity, admins can view any user's activity
    if (session.user.id !== userId && !canAccessAdminRoutes(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 365' },
        { status: 400 }
      );
    }

    const summary = await ActivityLogger.getUserActivitySummary(userId, days);

    // Log the activity (only if admin is viewing another user's activity)
    if (session.user.id !== userId) {
      await ActivityLogger.log({
        userId: session.user.id,
        action: ActivityAction.SYSTEM_MAINTENANCE,
        details: {
          operation: 'VIEW_USER_ACTIVITY',
          targetUserId: userId,
          period: `${days} days`,
        },
      });
    }

    return NextResponse.json(summary);
  } catch (error) {
    logger.error(
      'Error fetching user activity summary:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
