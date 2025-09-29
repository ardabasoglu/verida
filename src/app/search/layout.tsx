import { ReactNode } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { PageStats } from '@/components/pages/page-stats';
import { PageHeader } from '@/components/layout/page-header';

export default function SearchLayout({ children }: { children: ReactNode }) {
  // Sidebar content for search page
  const sidebarContent = (
    <div className="space-y-6">
      <PageStats />
    </div>
  );

  return (
    <MainLayout showSidebar={true} sidebarContent={sidebarContent}>
      <PageHeader
        title="Arama"
        description="Kurumsal bilgi bankasında arama yapın"
        breadcrumbs={[{ label: 'Arama' }]}
      />
      {children}
    </MainLayout>
  );
}
