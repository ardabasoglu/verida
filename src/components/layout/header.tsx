'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/user-menu';
import { NotificationBadge } from '@/components/notifications/notification-badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/hooks/use-auth';

interface HeaderProps {
  showSidebar?: boolean;
}

export function Header({ showSidebar = false }: HeaderProps) {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className={`sticky top-0 z-50 ${showSidebar ? 'lg:ml-64' : ''}`}>
      <header
        className="w-full border-b shadow-sm"
        style={{ backgroundColor: 'hsl(var(--background))' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-end">
            {/* Right Side */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications and User Menu */}
              {isLoading ? (
                <div className="h-8 w-8 animate-pulse bg-muted rounded-full"></div>
              ) : isAuthenticated ? (
                <>
                  <NotificationBadge />
                  <UserMenu />
                </>
              ) : (
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm" className="text-sm">
                    Giriş Yap
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
