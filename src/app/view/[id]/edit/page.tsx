import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PageForm from '@/components/forms/page-form';
import { extractYouTubeVideosFromContent, cleanContentFromYouTubeEmbeds } from '@/lib/youtube-content-utils';

interface EditViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Disable static generation for this page since it requires database access
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: EditViewPageProps): Promise<Metadata> {
  const { id } = await params;
  const page = await prisma.page.findUnique({
    where: { id },
    select: { title: true },
  });

  if (!page) {
    return {
      title: 'Sayfa Bulunamadı - Verida',
    };
  }

  return {
    title: `${page.title} Düzenle - Verida`,
    description: 'Kurumsal bilgi sayfasını düzenleyin',
  };
}

export default async function EditViewPage({ params }: EditViewPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check domain restriction
  if (!session.user.email?.endsWith('@dgmgumruk.com')) {
    redirect('/unauthorized');
  }

  // Fetch the page
  const page = await prisma.page.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      pageType: true,
      tags: true,
      authorId: true,
    },
  });

  if (!page) {
    notFound();
  }

  // Check permissions - author, editor, admin, or system admin can edit
  const canEdit =
    page.authorId === session.user.id ||
    ['EDITOR', 'ADMIN', 'SYSTEM_ADMIN'].includes(session.user.role);

  if (!canEdit) {
    redirect('/unauthorized');
  }

  console.log('📄 Original page content:', page.content);
  const youtubeVideos = extractYouTubeVideosFromContent(page.content || '');
  console.log('🎬 Extracted YouTube videos:', youtubeVideos);
  const cleanedContent = cleanContentFromYouTubeEmbeds(page.content || '');
  console.log('🧹 Cleaned content:', cleanedContent);

  return (
    <PageForm
      initialData={{
        id: page.id,
        title: page.title,
        content: cleanedContent,
        pageType: page.pageType,
        tags: page.tags,
        youtubeVideos,
      }}
      isEditing={true}
    />
  );
}