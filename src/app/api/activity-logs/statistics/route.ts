import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActivityLogger, ActivityAction } from '@/lib/activity-logger';
import { UserRole } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and system admins can view activity statistics
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.SYSTEM_ADMIN
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;

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

    const statistics = await ActivityLogger.getStatistics(startDate, endDate);

    // Log the admin activity
    await ActivityLogger.log({
      userId: session.user.id,
      action: ActivityAction.SYSTEM_MAINTENANCE,
      details: {
        operation: 'VIEW_ACTIVITY_STATISTICS',
        period: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      },
    });

    return NextResponse.json(statistics);
  } catch (error) {
    logger.error(
      'Error fetching activity statistics:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
