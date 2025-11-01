import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  ActivityLogger,
  ActivityAction,
  ResourceType,
} from '@/lib/activity-logger';

import { logger } from '@/lib/logger';
import { canAccessAdminRoutes } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and system admins can view activity logs
    if (!canAccessAdminRoutes(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const userId = searchParams.get('userId') || undefined;
    const action = (searchParams.get('action') as ActivityAction) || undefined;
    const resourceType =
      (searchParams.get('resourceType') as ResourceType) || undefined;
    const resourceId = searchParams.get('resourceId') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate dates
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start date' },
        { status: 400 }
      );
    }
    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
    }

    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }
    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be non-negative' },
        { status: 400 }
      );
    }

    const result = await ActivityLogger.getLogs({
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      limit,
      offset,
    });

    // Log the admin activity
    await ActivityLogger.log({
      userId: session.user.id,
      action: ActivityAction.SYSTEM_MAINTENANCE,
      details: {
        operation: 'VIEW_ACTIVITY_LOGS',
        filters: {
          userId,
          action,
          resourceType,
          resourceId,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error(
      'Error fetching activity logs:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
