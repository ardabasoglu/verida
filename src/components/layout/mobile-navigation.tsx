'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChartBarIcon,
  EyeSlashIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

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
    roles: ['SYSTEM_ADMIN', 'ADMIN'],
  },
  {
    name: 'Okunmamış',
    href: '/pages/unread',
    icon: EyeSlashIcon,
    roles: ['SYSTEM_ADMIN', 'ADMIN', 'EDITOR', 'MEMBER'],
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
    roles: ['SYSTEM_ADMIN', 'ADMIN'],
  },
  {
    name: 'Ayarlar',
    href: '/settings',
    icon: Cog6ToothIcon,
  },
  {
    name: 'Aktivite',
    href: '/admin/activity-logs',
    icon: ChartBarIcon,
    roles: ['SYSTEM_ADMIN', 'ADMIN'],
  },
];

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNavItems = navigationItems.filter((item) => {
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role);
  });

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Menu Button - Fixed at bottom right */}
      <button
        onClick={toggleMenu}
        className="lg:hidden fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`
        lg:hidden fixed inset-y-0 right-0 z-50 w-80 max-w-full
        bg-background shadow-xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <span className="font-bold text-lg text-foreground">Menü</span>
            <button
              onClick={closeMenu}
              className="p-2 text-muted-foreground hover:text-foreground"
              aria-label="Close menu"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
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
                  onClick={closeMenu}
                  className={`
                    flex items-center px-4 py-3 text-base font-medium rounded-lg
                    transition-colors duration-200
                    ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }
                  `}
                >
                  <item.icon
                    className={`
                    mr-4 h-6 w-6 flex-shrink-0
                    ${isActive ? 'text-primary' : 'text-muted-foreground'}
                  `}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          {user && (
            <div className="px-6 py-4 border-t border-border">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-base font-medium text-primary">
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
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
      </div>

      {/* Bottom Navigation Bar for Mobile (Alternative approach) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border px-4 py-2">
        <div className="flex justify-around items-center">
          {filteredNavItems.slice(0, 4).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center px-2 py-1 text-xs font-medium
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <item.icon
                  className={`
                  h-5 w-5 mb-1
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}
                `}
                />
                <span className="truncate max-w-12">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
