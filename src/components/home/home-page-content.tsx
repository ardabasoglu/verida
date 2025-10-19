'use client';

import { useState } from 'react';
import { FileText, Users, Settings, BarChart3 } from 'lucide-react';
import { ContentType } from '@prisma/client';
import { PageWithRelations } from '@/types';
import PublishedPagesSection from './published-pages-section';

interface HomePageContentProps {
  initialPages: PageWithRelations[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const PAGE_TYPE_CONFIG = {
  INFO: {
    label: 'Bilgi',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    borderColor: 'border-blue-200',
  },
  PROCEDURE: {
    label: 'Prosedür',
    icon: Settings,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-200',
  },
  ANNOUNCEMENT: {
    label: 'Duyuru',
    icon: Users,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    borderColor: 'border-yellow-200',
  },
  WARNING: {
    label: 'Uyarı',
    icon: BarChart3,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
    borderColor: 'border-red-200',
  },
};

export default function HomePageContent({
  initialPages,
  initialPagination,
}: HomePageContentProps) {
  const [selectedPageType, setSelectedPageType] = useState<ContentType | ''>('');

  const handlePageTypeFilter = (pageType: ContentType | '') => {
    setSelectedPageType(pageType);
  };

  const handleFilteredCountChange = (count: number) => {
    // This function is used by the child component to report filtered count
  };

  return (
    <>
      {/* Published Pages with integrated filters */}
      <PublishedPagesSection
        initialPages={initialPages}
        initialPagination={initialPagination}
        selectedPageType={selectedPageType}
        onPageTypeChange={handlePageTypeFilter}
        onFilteredCountChange={handleFilteredCountChange}
        pageTypeConfig={PAGE_TYPE_CONFIG}
      />
    </>
  );
}