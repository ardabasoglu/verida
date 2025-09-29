import { prisma } from './prisma';
import { UserRole, ContentType, Prisma } from '@prisma/client';
import { handleError } from './errors';
import { logger } from './logger';

// User utilities
export async function findUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        notificationPrefs: true,
      },
    });
  } catch (error) {
    logger.error(
      'Error finding user by email:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw handleError(error);
  }
}

export async function createUser(data: {
  email: string;
  name?: string;
  role?: UserRole;
}) {
  try {
    return await prisma.user.create({
      data: {
        ...data,
        role: data.role || UserRole.MEMBER,
        notificationPrefs: {
          create: {
            inAppNotifications: true,
          },
        },
      },
      include: {
        notificationPrefs: true,
      },
    });
  } catch (error) {
    logger.error(
      'Error creating user:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw handleError(error);
  }
}

// Page utilities
export async function findPageById(id: string) {
  try {
    return await prisma.page.findUnique({
      where: { id },
      include: {
        author: true,
        files: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  } catch (error) {
    logger.error(
      'Error finding page by id:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw handleError(error);
  }
}

export async function findPagesByType(
  pageType: ContentType,
  options?: {
    limit?: number;
    offset?: number;
    authorId?: string;
  }
) {
  try {
    const where = {
      pageType,
      published: true,
      ...(options?.authorId && { authorId: options.authorId }),
    };

    return await prisma.page.findMany({
      where,
      include: {
        author: true,
        files: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: options?.limit,
      skip: options?.offset,
    });
  } catch (error) {
    logger.error(
      'Error finding pages by type:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw handleError(error);
  }
}

export async function searchPages(
  query: string,
  options?: {
    pageType?: ContentType;
    tags?: string[];
    limit?: number;
    offset?: number;
  }
) {
  try {
    const where = {
      published: true,
      AND: [
        {
          OR: [
            { title: { contains: query, mode: 'insensitive' as const } },
            { content: { contains: query, mode: 'insensitive' as const } },
            { tags: { hasSome: [query] } },
          ],
        },
        ...(options?.pageType ? [{ pageType: options.pageType }] : []),
        ...(options?.tags?.length ? [{ tags: { hasSome: options.tags } }] : []),
      ],
    };

    return await prisma.page.findMany({
      where,
      include: {
        author: true,
        files: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: options?.limit,
      skip: options?.offset,
    });
  } catch (error) {
    logger.error(
      'Error searching pages:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw handleError(error);
  }
}

// Activity logging utility
export async function logActivity(data: {
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    return await prisma.activityLog.create({
      data: {
        ...data,
        details: data.details as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    logger.error(
      'Error logging activity:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw handleError(error);
  }
}

// Notification utilities
export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: string;
}) {
  try {
    return await prisma.notification.create({
      data,
    });
  } catch (error) {
    logger.error(
      'Error creating notification:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw handleError(error);
  }
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  try {
    return await prisma.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user can only mark their own notifications
      },
      data: {
        read: true,
      },
    });
  } catch (error) {
    logger.error(
      'Error marking notification as read:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw handleError(error);
  }
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  } catch (error) {
    logger.error(
      'Error getting unread notification count:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw handleError(error);
  }
}

// File utilities
export async function findFileById(id: string) {
  try {
    return await prisma.file.findUnique({
      where: { id },
      include: {
        uploadedBy: true,
        page: true,
      },
    });
  } catch (error) {
    logger.error(
      'Error finding file by id:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw handleError(error);
  }
}

// Database cleanup utilities
export async function cleanupOrphanedFiles() {
  try {
    // Find files that are not associated with any page
    const orphanedFiles = await prisma.file.findMany({
      where: {
        pageId: null,
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
        },
      },
    });

    if (orphanedFiles.length > 0) {
      await prisma.file.deleteMany({
        where: {
          id: {
            in: orphanedFiles.map((f) => f.id),
          },
        },
      });

      logger.info(`Cleaned up ${orphanedFiles.length} orphaned files`);
    }

    return orphanedFiles.length;
  } catch (error) {
    logger.error(
      'Error cleaning up orphaned files:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw handleError(error);
  }
}
