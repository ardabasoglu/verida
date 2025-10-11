'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChartBarIcon,
  UserGroupIcon,

} from '@heroicons/react/24/outline';

interface SidebarProps {
  children?: ReactNode;
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navigationItems: NavItem[] = [
  {
    name: 'Sayfalar',
    href: '/pages',
    icon: DocumentTextIcon,
  },
  {
    name: 'Arama',
    href: '/search',
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Yeni Sayfa',
    href: '/pages/create',
    icon: PlusIcon,
    roles: ['SYSTEM_ADMIN', 'ADMIN', 'EDITOR'],
  },
  {
    name: 'Aktivite Günlükleri',
    href: '/admin/activity-logs',
    icon: ChartBarIcon,
    roles: ['SYSTEM_ADMIN', 'ADMIN'],
  },
  {
    name: 'Kullanıcı Yönetimi',
    href: '/admin/users',
    icon: UserGroupIcon,
    roles: ['SYSTEM_ADMIN', 'ADMIN'],
  },
];

import { useState } from 'react';

export function Sidebar({ children, className = '' }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNavItems = navigationItems.filter((item) => {
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role);
  });

  // Sidebar classes for responsiveness
  const sidebarBase = `
    fixed inset-y-0 left-0 z-40 w-64
    bg-card border-r border-border
    transform transition-transform duration-300 ease-in-out
    ${className}
  `;
  const sidebarDesktop = 'hidden md:flex';
  const sidebarMobile = `
    flex md:hidden
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg focus:outline-none"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Sidebar for mobile */}
      <aside
        className={`${sidebarBase} ${sidebarMobile}`}
        style={{ minHeight: '100vh' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand Area */}
          <div className="flex items-center h-16 px-6 border-b border-border">
            <Link
              href="/"
              className="flex items-center space-x-2"
              onClick={() => setMobileOpen(false)}
            >
              <span className="font-bold text-lg text-foreground">VERIDA</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg
                    transition-colors duration-200
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <item.icon
                    className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-blue-700' : 'text-muted-foreground'}
                  `}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Custom Content */}
          {children && (
            <div className="px-4 py-4 border-t border-border">{children}</div>
          )}

          {/* User Info */}
          {user && (
            <div className="px-4 py-4 border-t border-border">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.role === 'SYSTEM_ADMIN' && 'Sistem Yöneticisi'}
                    {user.role === 'ADMIN' && 'Yönetici'}
                    {user.role === 'EDITOR' && 'Editör'}
                    {user.role === 'MEMBER' && 'Üye'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Sidebar for desktop (always open) */}
      <aside
        className={`${sidebarBase} ${sidebarDesktop}`}
        style={{ minHeight: '100vh' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand Area */}
          <div className="flex items-center h-16 px-6 border-b border-border flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-lg text-foreground">VERIDA</span>
            </Link>
          </div>

          {/* Main Content Area - Split into two sections */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Navigation Section */}
            <div className="flex-shrink-0">
              <div className="px-4 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Navigasyon
                </h3>
                <nav className="space-y-1">
                  {filteredNavItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          flex items-center px-3 py-2 text-sm font-medium rounded-lg
                          transition-colors duration-200
                          ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }
                        `}
                      >
                        <item.icon
                          className={`
                          mr-3 h-5 w-5 flex-shrink-0
                          ${isActive ? 'text-blue-700' : 'text-muted-foreground'}
                        `}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Statistics Section */}
            {children && (
              <div className="flex-1 min-h-0 px-4 py-4">
                <div className="h-full overflow-y-auto">{children}</div>
              </div>
            )}
          </div>

          {/* User Info */}
          {user && (
            <div className="px-4 py-4 border-t border-border flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.role === 'SYSTEM_ADMIN' && 'Sistem Yöneticisi'}
                    {user.role === 'ADMIN' && 'Yönetici'}
                    {user.role === 'EDITOR' && 'Editör'}
                    {user.role === 'MEMBER' && 'Üye'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
