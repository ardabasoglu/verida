import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MemberPageViewer from '@/components/pages/member-page-viewer';

interface ViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ViewPageProps): Promise<Metadata> {
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

export default async function ViewPageDetailPage({ params }: ViewPageProps) {
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

  // Only show published pages
  if (!page.published) {
    notFound();
  }

  return <MemberPageViewer page={page} />;
}