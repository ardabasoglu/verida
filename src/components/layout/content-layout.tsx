'use client';

import { ReactNode } from 'react';
import { MainLayout } from './main-layout';
import { PageHeader, BreadcrumbItem } from './page-header';
import { PageStats } from '@/components/pages/page-stats';

interface ContentLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  showSidebar?: boolean;
  sidebarContent?: ReactNode;
  headerActions?: ReactNode;
  className?: string;
}

export function ContentLayout({
  children,
  title,
  description,
  breadcrumbs = [],
  showSidebar = true,
  sidebarContent,
  headerActions,
  className = '',
}: ContentLayoutProps) {
  // Default sidebar content if none provided
  const defaultSidebarContent = (
    <div className="space-y-6">
      <PageStats />
    </div>
  );

  return (
    <MainLayout
      showSidebar={showSidebar}
      sidebarContent={sidebarContent || defaultSidebarContent}
      className={className}
    >
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      >
        {headerActions}
      </PageHeader>
      {children}
    </MainLayout>
  );
}


