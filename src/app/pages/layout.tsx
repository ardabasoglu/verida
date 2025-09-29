import { ReactNode } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { PageStats } from '@/components/pages/page-stats';
import { PageHeader } from '@/components/layout/page-header';

export default function PagesLayout({ children }: { children: ReactNode }) {
  // Sidebar content for all /pages and subpages
  const sidebarContent = (
    <div className="space-y-6">
      <PageStats />
    </div>
  );

  return (
    <MainLayout showSidebar={true} sidebarContent={sidebarContent}>
      {children}
    </MainLayout>
  );
}
