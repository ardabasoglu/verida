import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PageViewer from '@/components/pages/page-viewer';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const page = await prisma.page.findUnique({
    where: { id },
    select: { title: true, content: true },
  });

  if (!page) {
    return {
      title: 'Sayfa Bulunamadı - Verida',
    };
  }

  return {
    title: `${page.title} - Verida`,
    description: page.content
      ? page.content.substring(0, 160)
      : 'Kurumsal bilgi sayfası',
  };
}

export default async function PageDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check domain restriction
  if (!session.user.email?.endsWith('@dgmgumruk.com')) {
    redirect('/unauthorized');
  }

  // Fetch the page with all relations
  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      files: {
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          fileSize: true,
          createdAt: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          comments: true,
          files: true,
        },
      },
    },
  });

  if (!page) {
    notFound();
  }

  // Only show published pages (unless user is author or admin)
  if (
    !page.published &&
    page.authorId !== session.user.id &&
    !['ADMIN', 'SYSTEM_ADMIN'].includes(session.user.role)
  ) {
    notFound();
  }

  return <PageViewer page={page} showBreadcrumbs={true} />;
}
