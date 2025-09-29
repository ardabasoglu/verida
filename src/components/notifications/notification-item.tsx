'use client';

import { Notification } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  BellIcon,
  ExclamationTriangleIcon,
  SpeakerWaveIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return (
          <SpeakerWaveIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        );
      case 'warning':
        return (
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
        );
      case 'comment':
        return (
          <ChatBubbleLeftIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
        );
      case 'update':
        return (
          <ArrowPathIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        );
      default:
        return <BellIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNotificationBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-card';

    switch (type) {
      case 'announcement':
        return 'bg-blue-500/10 dark:bg-blue-500/20';
      case 'warning':
        return 'bg-red-500/10 dark:bg-red-500/20';
      case 'comment':
        return 'bg-green-500/10 dark:bg-green-500/20';
      case 'update':
        return 'bg-orange-500/10 dark:bg-orange-500/20';
      default:
        return 'bg-muted';
    }
  };

  const formatDate = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: tr,
      });
    } catch (error) {
      return 'Bilinmeyen zaman';
    }
  };

  return (
    <div
      className={`p-4 transition-colors hover:bg-muted/50 ${getNotificationBgColor(notification.type, notification.read)}`}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3
                className={`text-sm font-medium ${notification.read ? 'text-muted-foreground' : 'text-card-foreground'}`}
              >
                {notification.title}
              </h3>
              <p
                className={`mt-1 text-sm ${notification.read ? 'text-muted-foreground' : 'text-card-foreground'}`}
              >
                {notification.message}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(notification.createdAt)}
              </p>
            </div>

            {/* Unread indicator */}
            {!notification.read && (
              <div className="flex-shrink-0 ml-2">
                <div className="h-2 w-2 bg-primary rounded-full"></div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center space-x-2">
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="inline-flex items-center space-x-1 text-xs text-primary hover:text-primary/80"
              >
                <EyeIcon className="h-3 w-3" />
                <span>Okundu İşaretle</span>
              </button>
            )}
            <button
              onClick={() => onDelete(notification.id)}
              className="inline-flex items-center space-x-1 text-xs text-destructive hover:text-destructive/80"
            >
              <TrashIcon className="h-3 w-3" />
              <span>Sil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
