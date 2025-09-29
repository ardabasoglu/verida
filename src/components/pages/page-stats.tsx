'use client';

import { useState, useEffect } from 'react';
import { ContentType } from '@prisma/client';

interface PageStats {
  total: number;
  byType: Record<ContentType, number>;
  recentCount: number;
}

interface PageStatsProps {
  className?: string;
}

const PAGE_TYPE_CONFIG = {
  INFO: {
    label: 'Bilgi',
    color: 'bg-blue-100 text-blue-800',
    icon: '📚',
  },
  PROCEDURE: {
    label: 'Prosedür',
    color: 'bg-green-100 text-green-800',
    icon: '⚙️',
  },
  ANNOUNCEMENT: {
    label: 'Duyuru',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '📢',
  },
  WARNING: {
    label: 'Uyarı',
    color: 'bg-red-100 text-red-800',
    icon: '⚠️',
  },
};

export function PageStats({ className = '' }: PageStatsProps) {
  const [stats, setStats] = useState<PageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/pages/stats');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching page stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div
        className={`bg-card rounded-lg shadow-sm border border-border p-4 ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-3 bg-border rounded w-1/2 mb-3"></div>
          <div className="h-6 bg-border rounded w-1/3 mb-2"></div>
          <div className="h-2 bg-border rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-2 bg-border rounded"></div>
            <div className="h-2 bg-border rounded w-4/5"></div>
            <div className="h-2 bg-border rounded w-3/5"></div>
            <div className="h-2 bg-border rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div
      className={`bg-card rounded-lg shadow-sm border border-border p-4 ${className}`}
    >
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Sayfa İstatistikleri
      </h3>

      {/* Total Pages */}
      <div className="mb-4">
        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
        <div className="text-xs text-muted-foreground">Toplam Sayfa</div>
      </div>

      {/* Pages by Type */}
      <div className="space-y-2 mb-4">
        <h4 className="text-xs font-medium text-foreground">
          Tip Bazında Dağılım
        </h4>
        <div className="space-y-1">
          {Object.entries(PAGE_TYPE_CONFIG).map(([type, config]) => {
            const count = stats.byType[type as ContentType] || 0;
            const percentage =
              stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

            return (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{config.icon}</span>
                  <span className="text-xs text-foreground">
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">{count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Son 7 günde</span>
          <span className="text-xs font-medium text-green-600">
            {stats.recentCount}
          </span>
        </div>
      </div>
    </div>
  );
}
