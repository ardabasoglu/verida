'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';

interface ActivityStatistics {
  totalActivities: number;
  activitiesByAction: Array<{
    action: string;
    _count: { action: number };
  }>;
  topUsers: Array<{
    userId: string;
    _count: { userId: number };
    user?: {
      id: string;
      name?: string;
      email: string;
      role: UserRole;
    };
  }>;
  activitiesByResourceType: Array<{
    resourceType: string | null;
    _count: { resourceType: number };
  }>;
}

export default function ActivityStatistics() {
  const { data: session } = useSession();
  const [statistics, setStatistics] = useState<ActivityStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // Check if user has permission to view statistics
  const canViewStats =
    session?.user?.role === UserRole.ADMIN ||
    session?.user?.role === UserRole.SYSTEM_ADMIN;

  const fetchStatistics = useCallback(async () => {
    if (!canViewStats) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await fetch(`/api/activity-logs/statistics?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data: ActivityStatistics = await response.json();
      setStatistics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [canViewStats, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchStatistics();
  }, [canViewStats, fetchStatistics]);

  const handleDateRangeChange = (
    field: 'startDate' | 'endDate',
    value: string
  ) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const applyDateFilter = () => {
    fetchStatistics();
  };

  const clearDateFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
    setTimeout(fetchStatistics, 0);
  };

  if (!canViewStats) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Erişim Reddedildi
        </h3>
        <p className="text-destructive/80">
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
            Aktivite İstatistikleri
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sistem aktivitelerinin genel istatistiklerini görüntüleyin.
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="px-6 py-4 bg-muted border-b border-border">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
                value={dateRange.startDate}
                onChange={(e) =>
                  handleDateRangeChange('startDate', e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
                value={dateRange.endDate}
                onChange={(e) =>
                  handleDateRangeChange('endDate', e.target.value)
                }
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyDateFilter}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
              >
                Filtrele
              </button>
              <button
                onClick={clearDateFilter}
                className="px-4 py-2 text-muted-foreground border border-input rounded-md hover:bg-muted text-sm"
              >
                Temizle
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-6 py-4 bg-destructive/10 border-l-4 border-destructive">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="px-6 py-8 text-center">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">
                İstatistikler yükleniyor...
              </span>
            </div>
          </div>
        ) : statistics ? (
          <div className="p-6 space-y-8">
            {/* Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">
                  {statistics.totalActivities.toLocaleString('tr-TR')}
                </div>
                <div className="text-sm text-primary/80 mt-1">
                  Toplam Aktivite
                </div>
              </div>
              <div className="bg-green-500/10 p-6 rounded-lg border border-green-500/20">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {statistics.activitiesByAction.length}
                </div>
                <div className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                  Farklı Aksiyon Tipi
                </div>
              </div>
              <div className="bg-purple-500/10 p-6 rounded-lg border border-purple-500/20">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {statistics.topUsers.length}
                </div>
                <div className="text-sm text-purple-600/80 dark:text-purple-400/80 mt-1">
                  Aktif Kullanıcı
                </div>
              </div>
              <div className="bg-orange-500/10 p-6 rounded-lg border border-orange-500/20">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {statistics.activitiesByResourceType.length}
                </div>
                <div className="text-sm text-orange-600/80 dark:text-orange-400/80 mt-1">
                  Kaynak Tipi
                </div>
              </div>
            </div>

            {/* Activities by Action */}
            <div>
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                Aksiyon Türlerine Göre Aktiviteler
              </h3>
              <div className="bg-muted rounded-lg p-4">
                <div className="space-y-3">
                  {statistics.activitiesByAction
                    .slice(0, 10)
                    .map((item, index) => (
                      <div
                        key={item.action}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-card-foreground">
                            {item.action}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${statistics.activitiesByAction[0] ? (item._count.action / statistics.activitiesByAction[0]._count.action) * 100 : 0}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {item._count.action.toLocaleString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Top Users */}
            <div>
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                En Aktif Kullanıcılar
              </h3>
              <div className="bg-muted rounded-lg p-4">
                <div className="space-y-3">
                  {statistics.topUsers.map((item, index) => (
                    <div
                      key={item.userId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-card-foreground">
                            {item.user?.name ||
                              item.user?.email ||
                              'Bilinmeyen Kullanıcı'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.user?.role} • {item.user?.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div
                            className="bg-green-600 dark:bg-green-400 h-2 rounded-full"
                            style={{
                              width: `${statistics.topUsers[0] ? (item._count.userId / statistics.topUsers[0]._count.userId) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {item._count.userId.toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activities by Resource Type */}
            <div>
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                Kaynak Türlerine Göre Aktiviteler
              </h3>
              <div className="bg-muted rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {statistics.activitiesByResourceType.map((item) => (
                    <div
                      key={item.resourceType || 'null'}
                      className="text-center"
                    >
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {item._count.resourceType.toLocaleString('tr-TR')}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.resourceType || 'Diğer'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
