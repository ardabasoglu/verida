'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/hooks/use-notifications';
import toast from 'react-hot-toast';

export function RealTimeNotifications() {
  const { data: session } = useSession();
  const { refreshUnreadCount } = useNotifications();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    // Create EventSource connection for SSE
    const eventSource = new EventSource('/api/notifications/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('Connected to notification stream');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            console.log('Notification stream connected');
            break;
            
          case 'notification':
            // New notification received
            const notification = data.data;
            
            // Show toast notification
            toast.success(notification.title, {
              duration: 5000,
              position: 'top-right',
            });
            
            // Refresh unread count
            refreshUnreadCount();
            break;
            
          case 'heartbeat':
            // Keep connection alive
            break;
            
          default:
            console.log('Unknown notification type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing notification data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Notification stream error:', error);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('Attempting to reconnect to notification stream');
          // The useEffect will handle creating a new connection
        }
      }, 5000);
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [session?.user?.id, refreshUnreadCount]);

  // This component doesn't render anything visible
  return null;
}