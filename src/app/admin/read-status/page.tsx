import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ReadStatusManager from '@/components/admin/read-status-manager';
import { isSystemAdmin } from '@/lib/auth-utils';
import { PageHeader } from '@/components/layout/page-header';

export default async function ReadStatusPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check domain restriction
  if (!session.user.email?.endsWith('@dgmgumruk.com')) {
    redirect('/unauthorized');
  }

  // Only SYSTEM_ADMIN can access read status management
  if (!isSystemAdmin(session.user.role)) {
    redirect('/unauthorized');
  }

  return (
    <>
      <PageHeader
        title="Okuma Durumu Yönetimi"
        description="Kullanıcıların sayfa okuma durumlarını yönetin ve sıfırlayın"
        breadcrumbs={[
          { label: 'Yönetim', href: '/admin' },
          { label: 'Okuma Durumu Yönetimi' },
        ]}
      />
      <ReadStatusManager />
    </>
  );
}