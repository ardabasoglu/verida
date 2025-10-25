import { ReactNode } from 'react';
import { MainLayout } from '@/components/layout/main-layout';

export default function ViewLayout({ children }: { children: ReactNode }) {
  // No sidebar for member users viewing pages
  return (
    <MainLayout showSidebar={false}>
      {children}
    </MainLayout>
  );
}