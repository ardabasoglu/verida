import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  ActivityLogger,
  ActivityAction,
  ResourceType,
} from '@/lib/activity-logger';
import { UserRole } from '@prisma/client';
import { getRequestMetadata } from '@/lib/request-utils';

/**
 * Test endpoint for activity logging system
 * Only available in development mode
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can run tests
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.SYSTEM_ADMIN
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestMetadata = getRequestMetadata(request);
    const testResults = [];

    // Test 1: Basic activity logging
    try {
      const log1 = await ActivityLogger.log({
        userId: session.user.id,
        action: ActivityAction.SYSTEM_MAINTENANCE,
        resourceType: ResourceType.SYSTEM,
        ipAddress: requestMetadata.ipAddress,
        userAgent: requestMetadata.userAgent,
        details: {
          test: 'basic_logging',
          timestamp: new Date().toISOString(),
        },
      });
      testResults.push({
        test: 'basic_logging',
        status: 'success',
        logId: log1.id,
      });
    } catch (error) {
      testResults.push({
        test: 'basic_logging',
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 2: Activity statistics
    try {
      const stats = await ActivityLogger.getStatistics();
      testResults.push({
        test: 'statistics',
        status: 'success',
        totalActivities: stats.totalActivities,
        actionTypes: stats.activitiesByAction.length,
      });
    } catch (error) {
      testResults.push({
        test: 'statistics',
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 3: User activity summary
    try {
      const summary = await ActivityLogger.getUserActivitySummary(
        session.user.id,
        7
      );
      testResults.push({
        test: 'user_summary',
        status: 'success',
        totalActivities: summary.totalActivities,
        period: summary.period,
      });
    } catch (error) {
      testResults.push({
        test: 'user_summary',
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 4: Activity filtering
    try {
      const filtered = await ActivityLogger.getLogs({
        userId: session.user.id,
        action: ActivityAction.SYSTEM_MAINTENANCE,
        limit: 5,
      });
      testResults.push({
        test: 'filtering',
        status: 'success',
        logsFound: filtered.logs.length,
        total: filtered.total,
      });
    } catch (error) {
      testResults.push({
        test: 'filtering',
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Log the test activity
    await ActivityLogger.log({
      userId: session.user.id,
      action: ActivityAction.SYSTEM_MAINTENANCE,
      resourceType: ResourceType.SYSTEM,
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
      details: {
        operation: 'ACTIVITY_LOGGING_TEST',
        testResults: testResults.map((r) => ({
          test: r.test,
          status: r.status,
        })),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Activity logging system test completed',
      results: testResults,
      requestMetadata,
    });
  } catch (error) {
    console.error('Error in activity logging test:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
