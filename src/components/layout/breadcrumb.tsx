'use client';

import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav
      className={`flex items-center space-x-1 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="Ana sayfa"
      >
        <HomeIcon className="h-4 w-4" />
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-32 sm:max-w-none"
              title={item.label}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="text-foreground font-medium truncate max-w-32 sm:max-w-none"
              title={item.label}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
