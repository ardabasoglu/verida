import { ReactNode } from 'react';
import { PageHeader } from '@/components/layout/page-header';

export default function UsersLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader
        title="Kullanıcı Yönetimi"
        description="Kullanıcıları görüntüleyin, yönetin ve yeni kullanıcılar ekleyin"
        breadcrumbs={[
          { label: 'Yönetim', href: '/admin' },
          { label: 'Kullanıcı Yönetimi' },
        ]}
      />
      {children}
    </>
  );
}
