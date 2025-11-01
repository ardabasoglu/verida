import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { PageStats } from '@/components/pages/page-stats';
import { canAccessPagesManagement } from '@/lib/auth-utils';

export default async function PagesLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check domain restriction
  if (!session.user.email?.endsWith('@dgmgumruk.com')) {
    redirect('/unauthorized');
  }

  // Check role-based access - only ADMIN and SYSTEM_ADMIN can access /pages
  if (!canAccessPagesManagement(session)) {
    redirect('/unauthorized');
  }

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
