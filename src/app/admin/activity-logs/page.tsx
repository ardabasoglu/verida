'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import ActivityLogViewer from '@/components/admin/activity-log-viewer';
import ActivityStatistics from '@/components/admin/activity-statistics';

export default function ActivityLogsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'logs' | 'statistics'>('logs');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Oturum Açmanız Gerekiyor
          </h1>
          <p className="text-gray-600">
            Bu sayfayı görüntülemek için lütfen oturum açın.
          </p>
        </div>
      </div>
    );
  }

  const canAccess =
    session.user.role === UserRole.ADMIN ||
    session.user.role === UserRole.SYSTEM_ADMIN;

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Erişim Reddedildi
          </h1>
          <p className="text-gray-600">
            Bu sayfayı görüntülemek için yönetici yetkilerine sahip olmanız
            gerekir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            }`}
          >
            Aktivite Günlükleri
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'statistics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            }`}
          >
            İstatistikler
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'logs' && <ActivityLogViewer />}
        {activeTab === 'statistics' && <ActivityStatistics />}
      </div>
    </div>
  );
}
