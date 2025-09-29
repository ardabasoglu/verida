'use client';

import { useState, useEffect } from 'react';
import { Notification } from '@prisma/client';
import { ApiResponse } from '@/types';
import { 
  BellIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface NotificationHistoryProps {
  limit?: number;
  showFilters?: boolean;
}

type NotificationFilter = 'all' | 'unread' | 'announcement' | 'warning' | 'comment' | 'update';

export function NotificationHistory({ 
  limit = 50, 
  showFilters = true 
}: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchNotifications(1, filter);
  }, [filter]);

  const fetchNotifications = async (pageNum: number, currentFilter: NotificationFilter) => {
    try {
      setLoading(pageNum === 1);
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
      });

      if (currentFilter === 'unread') {
        params.append('unreadOnly', 'true');
      }

      const response = await fetch(`/api/notifications?${params}`);
      const data: ApiResponse<Notification[]> = await response.json();

      if (data.success && data.data) {
        let filteredData = data.data;

        // Apply client-side filtering for notification types
        if (currentFilter !== 'all' && currentFilter !== 'unread') {
          filteredData = data.data.filter(n => n.type === currentFilter);
        }

        if (pageNum === 1) {
          setNotifications(filteredData);
        } else {
          setNotifications(prev => [...prev, ...filteredData]);
        }
        
        setHasMore(data.pagination ? data.pagination.page < data.pagination.totalPages : false);
        setTotalCount(data.pagination?.total || 0);
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

  const markAsUnread = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: false }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setTotalCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, filter);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <BellIcon className="h-5 w-5 text-blue-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'comment':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-green-600" />;
      case 'update':
        return <InformationCircleIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <BellIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'Duyuru';
      case 'warning':
        return 'Uyarı';
      case 'comment':
        return 'Yorum';
      case 'update':
        return 'Güncelleme';
      default:
        return 'Bildirim';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtrele:</span>
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'unread', label: 'Okunmamış' },
            { key: 'announcement', label: 'Duyurular' },
            { key: 'warning', label: 'Uyarılar' },
            { key: 'comment', label: 'Yorumlar' },
            { key: 'update', label: 'Güncellemeler' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as NotificationFilter)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === key
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-muted text-foreground hover:bg-border border border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {totalCount > 0 ? `${notifications.length} / ${totalCount} bildirim` : 'Bildirim bulunamadı'}
        </span>
        {notifications.length > 0 && (
          <span>
            {notifications.filter(n => !n.read).length} okunmamış
          </span>
        )}
      </div>

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse border border-border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="h-5 w-5 bg-border rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-border rounded w-3/4"></div>
                  <div className="h-3 bg-border rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Bildirim bulunamadı
          </h3>
          <p className="text-muted-foreground">
            {filter === 'all' 
              ? 'Henüz hiç bildiriminiz yok.'
              : `${filter === 'unread' ? 'Okunmamış' : getNotificationTypeText(filter)} bildiriminiz yok.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 transition-colors ${
                notification.read 
                  ? 'border-border bg-card' 
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${
                        notification.read ? 'text-foreground' : 'text-blue-900'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        notification.read ? 'text-muted-foreground' : 'text-blue-800'
                      }`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {getNotificationTypeText(notification.type)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-4">
                      {notification.read ? (
                        <button
                          onClick={() => markAsUnread(notification.id)}
                          className="p-1 text-muted-foreground hover:text-muted-foreground transition-colors"
                          title="Okunmamış olarak işaretle"
                        >
                          <EyeSlashIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                          title="Okundu olarak işaretle"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Bildirimi sil"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}