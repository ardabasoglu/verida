import { ReactNode } from 'react';
import { PageHeader } from '@/components/layout/page-header';

export default function ActivityLogsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader
        title="Aktivite Yönetimi"
        description="Sistem aktivitelerini görüntüleyin ve analiz edin"
        breadcrumbs={[
          { label: 'Yönetim', href: '/admin' },
          { label: 'Aktivite Yönetimi' },
        ]}
      />
      {children}
    </>
  );
}
