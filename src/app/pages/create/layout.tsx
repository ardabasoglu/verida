import { ReactNode } from 'react';
import { PageHeader } from '@/components/layout/page-header';

export default function CreatePageLayout({
  children,
}: {
  children: ReactNode;
}) {
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
      {children}
    </>
  );
}
