import { ReactNode } from 'react';

export default function CreatePageLayout({
  children,
}: {
  children: ReactNode;
}) {
  // The parent /pages layout already provides MainLayout with sidebar
  // No need to wrap in another MainLayout here
  return <>{children}</>;
}
