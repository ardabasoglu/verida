'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import { ActivityAction, ResourceType } from '@/lib/activity-logger';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    role: UserRole;
  };
}

interface ActivityLogResponse {
  logs: ActivityLog[];
  total: number;
  hasMore: boolean;
}

interface ActivityLogFilters {
  userId?: string;
  action?: ActivityAction;
  resourceType?: ResourceType;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
}

export default function ActivityLogViewer() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<ActivityLogFilters>({});

  const limit = 50;

  // Check if user has permission to view activity logs
  const canViewLogs =
    session?.user?.role === UserRole.ADMIN ||
    session?.user?.role === UserRole.SYSTEM_ADMIN;

  const fetchLogs = useCallback(async (newOffset = 0, newFilters = filters) => {
    if (!canViewLogs) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: newOffset.toString(),
      });

      // Add filters to params
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/activity-logs?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }

      const data: ActivityLogResponse = await response.json();

      if (newOffset === 0) {
        setLogs(data.logs);
      } else {
        setLogs((prev) => [...prev, ...data.logs]);
      }

      setTotal(data.total);
      setHasMore(data.hasMore);
      setOffset(newOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [canViewLogs, filters]);

  useEffect(() => {
    fetchLogs();
  }, [canViewLogs, fetchLogs]);

  const handleFilterChange = (newFilters: ActivityLogFilters) => {
    setFilters(newFilters);
    fetchLogs(0, newFilters);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchLogs(offset + limit);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'text-green-600 dark:text-green-400';
    if (action.includes('UPDATED')) return 'text-blue-600 dark:text-blue-400';
    if (action.includes('DELETED')) return 'text-red-600 dark:text-red-400';
    if (action.includes('LOGIN')) return 'text-purple-600 dark:text-purple-400';
    return 'text-muted-foreground';
  };

  const getResourceTypeIcon = (resourceType?: string) => {
    switch (resourceType) {
      case 'USER':
        return '👤';
      case 'PAGE':
        return '📄';
      case 'FILE':
        return '📁';
      case 'COMMENT':
        return '💬';
      case 'NOTIFICATION':
        return '🔔';
      case 'SYSTEM':
        return '⚙️';
      default:
        return '📋';
    }
  };

  if (!canViewLogs) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
          Erişim Reddedildi
        </h3>
        <p className="text-red-600 dark:text-red-400">
          Bu sayfayı görüntülemek için yönetici yetkilerine sahip olmanız
          gerekir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card shadow rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-card-foreground">
            Aktivite Günlükleri
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sistemdeki tüm kullanıcı aktivitelerini görüntüleyin ve filtreleyin.
          </p>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-muted border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Kullanıcı ID
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
                placeholder="Kullanıcı ID"
                value={filters.userId || ''}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    userId: e.target.value || undefined,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Aksiyon
              </label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) =>
                  handleFilterChange({
                    ...filters,
                    action:
                      value === 'all' ? undefined : (value as ActivityAction),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {Object.values(ActivityAction).map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Kaynak Tipi
              </label>
              <Select
                value={filters.resourceType || 'all'}
                onValueChange={(value) =>
                  handleFilterChange({
                    ...filters,
                    resourceType:
                      value === 'all' ? undefined : (value as ResourceType),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {Object.values(ResourceType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
                value={filters.startDate || ''}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    startDate: e.target.value || undefined,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
                value={filters.endDate || ''}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    endDate: e.target.value || undefined,
                  })
                }
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => handleFilterChange({})}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Filtreleri Temizle
            </button>
            <div className="text-sm text-muted-foreground">
              Toplam {total} kayıt
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="divide-y divide-border">
          {error && (
            <div className="px-6 py-4 bg-red-50 border-l-4 border-red-400 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {logs.length === 0 && !loading && (
            <div className="px-6 py-8 text-center text-muted-foreground">
              Aktivite kaydı bulunamadı.
            </div>
          )}

          {logs.map((log) => (
            <div key={log.id} className="px-6 py-4 hover:bg-muted">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {getResourceTypeIcon(log.resourceType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`font-medium ${getActionColor(log.action)}`}
                      >
                        {log.action}
                      </span>
                      {log.resourceType && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          {log.resourceType}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium">
                        {log.user.name || log.user.email}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{log.user.role}</span>
                      {log.resourceId && (
                        <>
                          <span className="mx-2">•</span>
                          <span>ID: {log.resourceId}</span>
                        </>
                      )}
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          Detayları göster
                        </summary>
                        <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto text-foreground">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(log.createdAt)}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="px-6 py-4 text-center">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Yükleniyor...</span>
              </div>
            </div>
          )}

          {hasMore && !loading && (
            <div className="px-6 py-4 text-center">
              <button
                onClick={loadMore}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
              >
                Daha Fazla Yükle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
