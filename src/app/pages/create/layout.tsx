import { ReactNode } from 'react';
import { PageHeader } from '@/components/layout/page-header';

export default function CreatePageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          title="Yeni Sayfa Oluştur"
          description="Yeni bir kurumsal bilgi sayfası oluşturun"
          breadcrumbs={[
            { label: 'Sayfalar', href: '/pages' },
            { label: 'Yeni Sayfa Oluştur' },
          ]}
        />
        {children}
      </div>
    </div>
  );
}
