import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { StatsQueries } from '@/lib/query-optimizer';
import { FileText, Users, Settings, BarChart3 } from 'lucide-react';

import { prisma } from '@/lib/prisma';
import PublishedPagesSection from '@/components/home/published-pages-section';

export default async function Home() {
  const stats = await StatsQueries.getGlobalStats();

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
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider">
              VERIDA
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mt-1 font-medium">
              Kurumsal Bilgi Yönetim Platformu
            </p>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="py-3 bg-gradient-to-r from-background to-muted/20 flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-4">
              <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Verida platformuna hoş geldiniz. Kurumsal bilgi yönetiminde
                verimlilik ve işbirliğini bir araya getiren platformumuz, önemli
                bilgileri merkezi bir yerde toplar. Güvenli erişim kontrolleri
                ile takımınızın ihtiyaç duyduğu bilgilere anında ulaşmasını
                sağlar ve iş süreçlerinizi dijitalleştirerek operasyonel
                verimliliği artırır.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Published Pages Section */}
      <section className="flex-1 bg-muted/30 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-7xl mx-auto">
            {/* Quick Navigation */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4 text-center">
                Sayfa Türleri
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <a href="/pages?pageType=INFO">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                    <CardContent className="pt-3 pb-3">
                      <FileText className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium">Bilgi</div>
                    </CardContent>
                  </Card>
                </a>

                <a href="/pages?pageType=PROCEDURE">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                    <CardContent className="pt-3 pb-3">
                      <Settings className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium">Prosedür</div>
                    </CardContent>
                  </Card>
                </a>

                <a href="/pages?pageType=ANNOUNCEMENT">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                    <CardContent className="pt-3 pb-3">
                      <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium">Duyuru</div>
                    </CardContent>
                  </Card>
                </a>

                <a href="/pages?pageType=WARNING">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                    <CardContent className="pt-3 pb-3">
                      <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium">Uyarı</div>
                    </CardContent>
                  </Card>
                </a>
              </div>

              {/* App Statistics */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <Card className="text-center">
                  <CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {stats.totalPages}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Toplam Sayfa
                    </div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {stats.totalUsers}
                    </div>
                    <div className="text-sm text-muted-foreground">Kullanıcı</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Published Pages */}
            <PublishedPagesSection
              initialPages={initialPages}
              initialPagination={initialPagination}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-4 flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-3 md:mb-0">
              <h3 className="text-sm font-semibold mb-1">Verida</h3>
              <p className="text-xs text-muted-foreground">
                Kurumsal Bilgi Yönetim Platformu
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Geliştiren</p>
              <div className="h-6 flex items-center justify-center">
                <Image
                  src="/dgm-logo.png"
                  alt="DGM Gümrük Logo"
                  width={24}
                  height={24}
                  className="h-6 w-auto mx-auto opacity-60"
                />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
