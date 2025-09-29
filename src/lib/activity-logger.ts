import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { logger } from './logger';
import { handleError } from './errors';
import { parseUserAgent } from './request-utils';

// Activity action types
export enum ActivityAction {
  // User actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',

  // Page actions
  PAGE_CREATED = 'PAGE_CREATED',
  PAGE_UPDATED = 'PAGE_UPDATED',
  PAGE_DELETED = 'PAGE_DELETED',
  PAGE_VIEWED = 'PAGE_VIEWED',

  // File actions
  FILE_UPLOADED = 'FILE_UPLOADED',
  FILE_DOWNLOADED = 'FILE_DOWNLOADED',
  FILE_DELETED = 'FILE_DELETED',

  // Comment actions
  COMMENT_CREATED = 'COMMENT_CREATED',
  COMMENT_UPDATED = 'COMMENT_UPDATED',
  COMMENT_DELETED = 'COMMENT_DELETED',

  // Search actions
  SEARCH_PERFORMED = 'SEARCH_PERFORMED',

  // Notification actions
  NOTIFICATION_CREATED = 'NOTIFICATION_CREATED',
  NOTIFICATION_READ = 'NOTIFICATION_READ',

  // System actions
  SYSTEM_BACKUP = 'SYSTEM_BACKUP',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
}

// Resource types
export enum ResourceType {
  USER = 'USER',
  PAGE = 'PAGE',
  FILE = 'FILE',
  COMMENT = 'COMMENT',
  NOTIFICATION = 'NOTIFICATION',
  SYSTEM = 'SYSTEM',
}

interface ActivityLogData {
  userId: string;
  action: ActivityAction;
  resourceType?: ResourceType;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

interface ActivityLogFilter {
  userId?: string;
  action?: ActivityAction;
  resourceType?: ResourceType;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Enhanced activity logging utility with comprehensive action tracking
 */
export class ActivityLogger {
  /**
   * Log a user activity
   */
  static async log(data: ActivityLogData) {
    try {
      const activityLog = await prisma.activityLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          details: {
            ...data.details,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            userAgentInfo: data.userAgent
              ? parseUserAgent(data.userAgent)
              : undefined,
            timestamp: new Date().toISOString(),
          },
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
        },
      });

      logger.info(`Activity logged: ${data.action} by user ${data.userId}`, {
        activityId: activityLog.id,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
      });

      return activityLog;
    } catch (error) {
      logger.error(
        'Error logging activity:',
        error instanceof Error ? error : new Error(String(error))
      );
      throw handleError(error);
    }
  }

  /**
   * Get activity logs with filtering and pagination
   */
  static async getLogs(filter: ActivityLogFilter = {}) {
    try {
      const where: Prisma.ActivityLogWhereInput = {};

      if (filter.userId) {
        where.userId = filter.userId;
      }

      if (filter.action) {
        where.action = filter.action;
      }

      if (filter.resourceType) {
        where.resourceType = filter.resourceType;
      }

      if (filter.resourceId) {
        where.resourceId = filter.resourceId;
      }

      if (filter.startDate || filter.endDate) {
        where.createdAt = {};
        if (filter.startDate) {
          where.createdAt.gte = filter.startDate;
        }
        if (filter.endDate) {
          where.createdAt.lte = filter.endDate;
        }
      }

      const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
          where,
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
          orderBy: {
            createdAt: 'desc',
          },
          take: filter.limit || 50,
          skip: filter.offset || 0,
        }),
        prisma.activityLog.count({ where }),
      ]);

      return {
        logs,
        total,
        hasMore: (filter.offset || 0) + logs.length < total,
      };
    } catch (error) {
      logger.error(
        'Error getting activity logs:',
        error instanceof Error ? error : new Error(String(error))
      );
      throw handleError(error);
    }
  }

  /**
   * Get activity statistics
   */
  static async getStatistics(startDate?: Date, endDate?: Date) {
    try {
      const where: Prisma.ActivityLogWhereInput = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = startDate;
        }
        if (endDate) {
          where.createdAt.lte = endDate;
        }
      }

      const [
        totalActivities,
        activitiesByAction,
        activitiesByUser,
        activitiesByResourceType,
      ] = await Promise.all([
        prisma.activityLog.count({ where }),
        prisma.activityLog.groupBy({
          by: ['action'],
          where,
          _count: {
            action: true,
          },
          orderBy: {
            _count: {
              action: 'desc',
            },
          },
        }),
        prisma.activityLog.groupBy({
          by: ['userId'],
          where,
          _count: {
            userId: true,
          },
          orderBy: {
            _count: {
              userId: 'desc',
            },
          },
          take: 10,
        }),
        prisma.activityLog.groupBy({
          by: ['resourceType'],
          where,
          _count: {
            resourceType: true,
          },
          orderBy: {
            _count: {
              resourceType: 'desc',
            },
          },
        }),
      ]);

      // Get user details for top users
      const topUserIds = activitiesByUser.map((item) => item.userId);
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: topUserIds,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      const topUsersWithDetails = activitiesByUser.map((item) => ({
        ...item,
        user: users.find((user) => user.id === item.userId),
      }));

      return {
        totalActivities,
        activitiesByAction,
        topUsers: topUsersWithDetails,
        activitiesByResourceType,
      };
    } catch (error) {
      logger.error(
        'Error getting activity statistics:',
        error instanceof Error ? error : new Error(String(error))
      );
      throw handleError(error);
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivitySummary(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activities = await prisma.activityLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      const actionCounts = activities.reduce(
        (acc, activity) => {
          acc[activity.action] = (acc[activity.action] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalActivities: activities.length,
        actionCounts,
        recentActivities: activities.slice(0, 10),
        period: `${days} days`,
      };
    } catch (error) {
      logger.error(
        'Error getting user activity summary:',
        error instanceof Error ? error : new Error(String(error))
      );
      throw handleError(error);
    }
  }

  /**
   * Clean up old activity logs (for maintenance)
   */
  static async cleanupOldLogs(daysToKeep: number = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await prisma.activityLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(
        `Cleaned up ${deletedCount.count} old activity logs older than ${daysToKeep} days`
      );

      return deletedCount.count;
    } catch (error) {
      logger.error(
        'Error cleaning up old activity logs:',
        error instanceof Error ? error : new Error(String(error))
      );
      throw handleError(error);
    }
  }
}

// Convenience functions for common activities
export const logUserActivity = (
  userId: string,
  action: ActivityAction,
  details?: Record<string, unknown>
) =>
  ActivityLogger.log({
    userId,
    action,
    resourceType: ResourceType.USER,
    details,
  });

export const logPageActivity = (
  userId: string,
  action: ActivityAction,
  pageId: string,
  details?: Record<string, unknown>
) =>
  ActivityLogger.log({
    userId,
    action,
    resourceType: ResourceType.PAGE,
    resourceId: pageId,
    details,
  });

export const logFileActivity = (
  userId: string,
  action: ActivityAction,
  fileId: string,
  details?: Record<string, unknown>
) =>
  ActivityLogger.log({
    userId,
    action,
    resourceType: ResourceType.FILE,
    resourceId: fileId,
    details,
  });

export const logCommentActivity = (
  userId: string,
  action: ActivityAction,
  commentId: string,
  details?: Record<string, unknown>
) =>
  ActivityLogger.log({
    userId,
    action,
    resourceType: ResourceType.COMMENT,
    resourceId: commentId,
    details,
  });

export const logSearchActivity = (
  userId: string,
  query: string,
  results: number
) =>
  ActivityLogger.log({
    userId,
    action: ActivityAction.SEARCH_PERFORMED,
    details: { query, resultsCount: results },
  });
