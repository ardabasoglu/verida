'use client';

import { ReactNode } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { MobileNavigation } from './mobile-navigation';
import { useAuth } from '@/hooks/use-auth';

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  sidebarContent?: ReactNode;
  className?: string;
}

export function MainLayout({
  children,
  showSidebar = false,
  sidebarContent,
  className = '',
}: MainLayoutProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header showSidebar={showSidebar && isAuthenticated} />

      <div className="flex">
        {/* Desktop Sidebar */}
        {showSidebar && isAuthenticated && (
          <Sidebar className="hidden lg:block">{sidebarContent}</Sidebar>
        )}

        {/* Main Content */}
        <main
          className={`
          flex-1 
          ${showSidebar && isAuthenticated ? 'lg:ml-64' : ''} 
          ${className}
        `}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      {isAuthenticated && <MobileNavigation />}
    </div>
  );
}
