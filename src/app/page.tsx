import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { StatsQueries } from '@/lib/query-optimizer';
import { FileText, Users, Settings, BarChart3 } from 'lucide-react';

export default async function Home() {
  const stats = await StatsQueries.getGlobalStats();
  return (
    <main className="h-screen bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-background flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary tracking-wider">
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

      {/* Page Type Navigation */}
      <section className="flex-1 bg-muted/30 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-bold mb-3 text-center">
              Sayfa Türleri
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Link href="/pages?type=bilgi">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                  <CardContent className="pt-2 pb-2">
                    <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
                    <div className="text-xs font-medium">Bilgi</div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/pages?type=prosedur">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                  <CardContent className="pt-2 pb-2">
                    <Settings className="h-5 w-5 text-primary mx-auto mb-1" />
                    <div className="text-xs font-medium">Prosedür</div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/pages?type=duyuru">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                  <CardContent className="pt-2 pb-2">
                    <Users className="h-5 w-5 text-primary mx-auto mb-1" />
                    <div className="text-xs font-medium">Duyuru</div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/pages?type=uyari">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                  <CardContent className="pt-2 pb-2">
                    <BarChart3 className="h-5 w-5 text-primary mx-auto mb-1" />
                    <div className="text-xs font-medium">Uyarı</div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* App Statistics */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="text-center">
                <CardContent className="pt-3 pb-3">
                  <div className="text-lg font-bold text-primary mb-1">
                    {stats.totalPages}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Toplam Sayfa
                  </div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-3 pb-3">
                  <div className="text-lg font-bold text-primary mb-1">
                    {stats.totalUsers}
                  </div>
                  <div className="text-xs text-muted-foreground">Kullanıcı</div>
                </CardContent>
              </Card>
            </div>
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
