'use client';

import { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from './notification-center';
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, refreshUnreadCount } = useNotifications();

  useEffect(() => {
    // Refresh unread count when component mounts
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Refresh unread count when opening
      refreshUnreadCount();
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Bildirimler"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1">
            <Badge
              label={unreadCount > 99 ? '99+' : unreadCount}
              color="red"
              className="h-5 w-5 flex items-center justify-center text-xs font-medium"
            />
          </span>
        )}
      </button>

      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
