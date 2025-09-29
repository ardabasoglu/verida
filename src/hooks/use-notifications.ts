'use client';

import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@prisma/client';
import { ApiResponse } from '@/types';

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      const data: ApiResponse<{ count: number }> = await response.json();
      
      if (data.success && data.data) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1, limit = 20, unreadOnly = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(unreadOnly && { unreadOnly: 'true' }),
      });

      const response = await fetch(`/api/notifications?${params}`);
      const data: ApiResponse<Notification[]> = await response.json();

      if (data.success && data.data) {
        if (page === 1) {
          setNotifications(data.data);
        } else {
          setNotifications(prev => [...prev, ...data.data!]);
        }
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        
        // Refresh unread count
        refreshUnreadCount();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, [refreshUnreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Refresh unread count
        refreshUnreadCount();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, [refreshUnreadCount]);

  // Create notification (admin only)
  const createNotification = useCallback(async (data: {
    userId: string;
    title: string;
    message: string;
    type: string;
  }) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<Notification> = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: 'Failed to create notification' };
    }
  }, []);

  // Initialize unread count on mount
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  return {
    unreadCount,
    notifications,
    loading,
    refreshUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
  };
}