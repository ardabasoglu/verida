import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PageList from '@/components/pages/page-list';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/layout/page-header';

export const metadata: Metadata = {
  title: 'Sayfalar - Verida',
  description: 'Kurumsal bilgi sayfalarını görüntüleyin ve yönetin',
};

export default async function PagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check domain restriction
  if (!session.user.email?.endsWith('@dgmgumruk.com')) {
    redirect('/unauthorized');
  }

  // Fetch initial pages (first 10, sorted by date desc)
  const initialPages = await prisma.page.findMany({
    where: { published: true },
    include: {
      author: true,
      files: true,
      comments: {
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { comments: true, files: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    skip: 0,
  });

  return (
    <>
      <PageHeader
        title="Sayfalar"
        description="Kurumsal bilgi sayfalarını görüntüleyin ve yönetin"
        breadcrumbs={[{ label: 'Sayfalar' }]}
      />
      <PageList initialPages={initialPages} />
    </>
  );
}
