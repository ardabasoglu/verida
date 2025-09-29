import { prisma } from '@/lib/prisma';
import { sendNotificationToUser, broadcastNotification } from '@/lib/notification-stream';
import { ContentType, UserRole } from '@prisma/client';

export interface NotificationData {
  title: string;
  message: string;
  type: string;
  userId?: string; // If specified, send to specific user, otherwise broadcast
}

// Create and send notification
export async function createAndSendNotification(data: NotificationData) {
  try {
    if (data.userId) {
      // Send to specific user
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
        },
      });

      // Send real-time notification
      sendNotificationToUser(data.userId, notification);
      return notification;
    } else {
      // Broadcast to all users
      const users = await prisma.user.findMany({
        select: { id: true },
      });

      const notifications = await Promise.all(
        users.map(user =>
          prisma.notification.create({
            data: {
              userId: user.id,
              title: data.title,
              message: data.message,
              type: data.type,
            },
          })
        )
      );

      // Send real-time notifications
      notifications.forEach(notification => {
        sendNotificationToUser(notification.userId, notification);
      });

      return notifications;
    }
  } catch (error) {
    console.error('Error creating and sending notification:', error);
    throw error;
  }
}

// Notification triggers for different events

// Trigger when a new announcement is published
export async function notifyNewAnnouncement(pageId: string, authorId: string) {
  try {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: { author: true },
    });

    if (!page || page.pageType !== 'ANNOUNCEMENT') {
      return;
    }

    // Get all users except the author
    const users = await prisma.user.findMany({
      where: {
        id: { not: authorId },
      },
      select: { id: true },
    });

    // Create notifications for all users
    const notifications = await Promise.all(
      users.map(user =>
        prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Yeni Duyuru',
            message: `"${page.title}" başlıklı yeni bir duyuru yayınlandı.`,
            type: 'announcement',
          },
        })
      )
    );

    // Send real-time notifications
    notifications.forEach(notification => {
      sendNotificationToUser(notification.userId, notification);
    });

    return notifications;
  } catch (error) {
    console.error('Error notifying new announcement:', error);
    throw error;
  }
}

// Trigger when a warning is published
export async function notifyNewWarning(pageId: string, authorId: string) {
  try {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: { author: true },
    });

    if (!page || page.pageType !== 'WARNING') {
      return;
    }

    // Get all users except the author
    const users = await prisma.user.findMany({
      where: {
        id: { not: authorId },
      },
      select: { id: true },
    });

    // Create notifications for all users
    const notifications = await Promise.all(
      users.map(user =>
        prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Önemli Uyarı',
            message: `"${page.title}" başlıklı önemli bir uyarı yayınlandı.`,
            type: 'warning',
          },
        })
      )
    );

    // Send real-time notifications
    notifications.forEach(notification => {
      sendNotificationToUser(notification.userId, notification);
    });

    return notifications;
  } catch (error) {
    console.error('Error notifying new warning:', error);
    throw error;
  }
}

// Trigger when a page is updated
export async function notifyPageUpdate(pageId: string, authorId: string) {
  try {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: { author: true },
    });

    if (!page) {
      return;
    }

    // Only notify for announcements and warnings
    if (!['ANNOUNCEMENT', 'WARNING'].includes(page.pageType)) {
      return;
    }

    // Get all users except the author
    const users = await prisma.user.findMany({
      where: {
        id: { not: authorId },
      },
      select: { id: true },
    });

    const pageTypeText = page.pageType === 'ANNOUNCEMENT' ? 'duyuru' : 'uyarı';

    // Create notifications for all users
    const notifications = await Promise.all(
      users.map(user =>
        prisma.notification.create({
          data: {
            userId: user.id,
            title: 'İçerik Güncellendi',
            message: `"${page.title}" başlıklı ${pageTypeText} güncellendi.`,
            type: 'update',
          },
        })
      )
    );

    // Send real-time notifications
    notifications.forEach(notification => {
      sendNotificationToUser(notification.userId, notification);
    });

    return notifications;
  } catch (error) {
    console.error('Error notifying page update:', error);
    throw error;
  }
}

// Trigger when a comment is added to a page
export async function notifyNewComment(pageId: string, commentAuthorId: string) {
  try {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: { author: true },
    });

    if (!page) {
      return;
    }

    // Only notify the page author if they're not the comment author
    if (page.authorId === commentAuthorId) {
      return;
    }

    const notification = await prisma.notification.create({
      data: {
        userId: page.authorId,
        title: 'Yeni Yorum',
        message: `"${page.title}" başlıklı sayfanıza yeni bir yorum eklendi.`,
        type: 'comment',
      },
    });

    // Send real-time notification
    sendNotificationToUser(page.authorId, notification);

    return notification;
  } catch (error) {
    console.error('Error notifying new comment:', error);
    throw error;
  }
}

// Get notification preferences for a user
export async function getUserNotificationPreferences(userId: string) {
  try {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          inAppNotifications: true,
        },
      });
    }

    return preferences;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    throw error;
  }
}

// Update notification preferences
export async function updateNotificationPreferences(
  userId: string,
  preferences: { inAppNotifications: boolean }
) {
  try {
    const updatedPreferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        ...preferences,
      },
    });

    return updatedPreferences;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}