import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PageForm from '@/components/forms/page-form';
import { PageHeader } from '@/components/layout/page-header';

export const metadata: Metadata = {
  title: 'Yeni Sayfa Oluştur - Verida',
  description: 'Yeni bir kurumsal bilgi sayfası oluşturun',
};

export default async function CreatePagePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check domain restriction
  if (!session.user.email?.endsWith('@dgmgumruk.com')) {
    redirect('/unauthorized');
  }

  // Check if user has editor role or higher
  const userRole = session.user.role;
  if (!['EDITOR', 'ADMIN', 'SYSTEM_ADMIN'].includes(userRole)) {
    redirect('/unauthorized');
  }

  return (
    <>
      <PageHeader
        title="Yeni Sayfa Oluştur"
        description="Yeni bir kurumsal bilgi sayfası oluşturun"
        breadcrumbs={[
          { label: 'Sayfalar', href: '/pages' },
          { label: 'Yeni Sayfa Oluştur' },
        ]}
      />
      <PageForm />
    </>
  );
}
