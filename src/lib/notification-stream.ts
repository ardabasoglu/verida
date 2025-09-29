import { Notification } from '@prisma/client';

// Shared connection registry for SSE controllers per user
const connections = new Map<string, ReadableStreamDefaultController>();

export function registerConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller);
}

export function unregisterConnection(userId: string) {
  connections.delete(userId);
}

export function sendNotificationToUser(userId: string, notification: Notification) {
  const controller = connections.get(userId);
  if (controller) {
    try {
      controller.enqueue(`data: ${JSON.stringify({ type: 'notification', data: notification })}\n\n`);
    } catch {
      console.error('Error sending notification to user:');
      connections.delete(userId);
    }
  }
}

export function broadcastNotification(notification: Notification) {
  connections.forEach((controller) => {
    try {
      controller.enqueue(`data: ${JSON.stringify({ type: 'notification', data: notification })}\n\n`);
    } catch {
      console.error('Error broadcasting notification:');
    }
  });
}