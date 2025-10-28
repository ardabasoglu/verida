import { prisma } from '@/lib/prisma';
import HomePageContent from '@/components/home/home-page-content';
import Image from 'next/image';

// Disable static generation for this page since it requires database access
export const dynamic = 'force-dynamic';

export default async function Home() {

  // Get total count of published pages for pagination
  const totalPublishedPages = await prisma.page.count({
    where: { published: true },
  });

  // Fetch initial published pages for the home page
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
    take: 6, // Show 6 pages initially on home page
    skip: 0,
  });

  // Create initial pagination data
  const initialPagination = {
    page: 1,
    limit: 6,
    total: totalPublishedPages,
    totalPages: Math.ceil(totalPublishedPages / 6),
  };

  return (
    <main className="min-h-screen bg-background flex flex-col content-container">
      {/* Header */}
      <header className="bg-background flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="text-left">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-wide">
                  VERIDA
                </h1>
                {/* DGM Logo */}
                <div className="flex-shrink-0">
                  <Image
                    src="/dgm-logo.png"
                    alt="DGM Logo"
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                </div>
              </div>
              <p className="text-sm md:text-base text-muted-foreground mt-1 font-medium">
                Kurumsal Bilgi Yönetim Platformu
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="py-3 bg-gradient-to-r from-background to-muted/20 flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">

          </div>
        </div>
      </section>

      {/* Published Pages Section */}
      <section className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Home Page Content with Interactive Navigation */}
            <HomePageContent
              initialPages={initialPages}
              initialPagination={initialPagination}
            />
          </div>
        </div>
      </section>


    </main>
  );
}
