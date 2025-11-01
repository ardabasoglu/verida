import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { canAccessUnreadPages } from '@/lib/auth-utils';

export default async function UnreadPagesLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check domain restriction
  if (!session.user.email?.endsWith('@dgmgumruk.com')) {
    redirect('/unauthorized');
  }

  // Check if user can access unread pages (EDITOR and MEMBER roles included)
  if (!canAccessUnreadPages(session)) {
    redirect('/unauthorized');
  }

  return (
    <MainLayout showSidebar={false}>
      {children}
    </MainLayout>
  );
}