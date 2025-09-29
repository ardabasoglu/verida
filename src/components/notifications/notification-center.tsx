'use client';

import { useState, useEffect } from 'react';
import { Notification } from '@prisma/client';
import { ApiResponse } from '@/types';
import { NotificationItem } from './notification-item';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1);
    }
  }, [isOpen]);

  const fetchNotifications = async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?page=${pageNum}&limit=20`);
      const data: ApiResponse<Notification[]> = await response.json();

      if (data.success && data.data) {
        if (pageNum === 1) {
          setNotifications(data.data);
        } else {
          setNotifications(prev => [...prev, ...data.data!]);
        }
        
        setHasMore(data.pagination ? data.pagination.page < data.pagination.totalPages : false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
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
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-card shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center space-x-2">
              <BellIcon className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Bildirimler</h2>
            </div>
            <div className="flex items-center space-x-2">
              {notifications.some(n => !n.read) && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center space-x-1 rounded-md px-2 py-1 text-sm text-blue-600 hover:bg-blue-50"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>Tümünü Okundu İşaretle</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
              >
                <span className="sr-only">Kapat</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Bildirimler yükleniyor...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <BellIcon className="h-12 w-12 text-gray-300" />
                <p className="mt-2">Henüz bildirim yok</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
                
                {hasMore && (
                  <div className="p-4">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      {loading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}