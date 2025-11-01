'use client';

import { useState } from 'react';
import ActivityLogViewer from '@/components/admin/activity-log-viewer';
import ActivityStatistics from '@/components/admin/activity-statistics';

export default function ActivityLogsPage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'statistics'>('logs');

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
