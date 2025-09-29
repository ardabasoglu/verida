'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ContentType } from '@prisma/client'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

interface PageBreadcrumbProps {
  pageTitle?: string
  pageType?: ContentType
  pageId?: string
  className?: string
}

const PAGE_TYPE_LABELS = {
  INFO: 'Bilgi',
  PROCEDURE: 'Prosedür',
  ANNOUNCEMENT: 'Duyuru',
  WARNING: 'Uyarı'
}

export function PageBreadcrumb({ pageTitle, pageType, pageId, className = '' }: PageBreadcrumbProps) {
  const pathname = usePathname()

  // Build breadcrumb items based on current path
  const buildBreadcrumbItems = () => {
    const items = []

    // Always start with home
    items.push({
      label: 'Ana Sayfa',
      href: '/',
      icon: <HomeIcon className="h-4 w-4" />
    })

    // Add pages section
    if (pathname.startsWith('/pages')) {
      items.push({
        label: 'Sayfalar',
        href: '/pages'
      })

      // If we're creating a new page
      if (pathname === '/pages/create') {
        items.push({
          label: 'Yeni Sayfa Oluştur'
        })
      }
      // If we're viewing/editing a specific page
      else if (pageId) {
        if (pageType) {
          items.push({
            label: PAGE_TYPE_LABELS[pageType],
            href: `/pages?pageType=${pageType}`
          })
        }

        if (pageTitle) {
          // If we're editing
          if (pathname.includes('/edit')) {
            items.push({
              label: pageTitle,
              href: `/pages/${pageId}`
            })
            items.push({
              label: 'Düzenle'
            })
          } else {
            // Just viewing
            items.push({
              label: pageTitle
            })
          }
        }
      }
    }
    // Add search section
    else if (pathname.startsWith('/search')) {
      items.push({
        label: 'Arama',
        href: '/search'
      })
    }

    return items
  }

  const breadcrumbItems = buildBreadcrumbItems()

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRightIcon className="h-4 w-4 text-muted-foreground mx-2 flex-shrink-0" />
          )}
          
          {item.href ? (
            <Link 
              href={item.href}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors truncate max-w-32 sm:max-w-none"
              title={item.label}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1">
              {item.icon}
              <span className="text-foreground font-medium truncate max-w-32 sm:max-w-none" title={item.label}>
                {item.label}
              </span>
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}

// Helper component for page-specific breadcrumbs
interface PageSpecificBreadcrumbProps {
  pageTitle: string
  pageType: ContentType
  pageId: string
  isEditing?: boolean
  className?: string
}

export function PageSpecificBreadcrumb({ 
  pageTitle, 
  pageType, 
  pageId, 
  isEditing = false, 
  className = '' 
}: PageSpecificBreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <Link 
        href="/" 
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="Ana sayfa"
      >
        <HomeIcon className="h-4 w-4" />
      </Link>
      
      <ChevronRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Link 
        href="/pages"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Sayfalar
      </Link>
      
      <ChevronRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Link 
        href={`/pages?pageType=${pageType}`}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {PAGE_TYPE_LABELS[pageType]}
      </Link>
      
      <ChevronRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      {isEditing ? (
        <>
          <Link 
            href={`/pages/${pageId}`}
            className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-32 sm:max-w-none"
            title={pageTitle}
          >
            {pageTitle}
          </Link>
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-foreground font-medium">
            Düzenle
          </span>
        </>
      ) : (
        <span className="text-foreground font-medium truncate max-w-32 sm:max-w-none" title={pageTitle}>
          {pageTitle}
        </span>
      )}
    </nav>
  )
}