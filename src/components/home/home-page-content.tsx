'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  stats: {
    totalPages: number;
    totalUsers: number;
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
  stats,
}: HomePageContentProps) {
  const [selectedPageType, setSelectedPageType] = useState<ContentType | ''>('');
  const [filteredCount, setFilteredCount] = useState<number | null>(null);

  const handlePageTypeFilter = (pageType: ContentType | '') => {
    setSelectedPageType(pageType);
  };

  const handleClearFilter = () => {
    setSelectedPageType('');
    setFilteredCount(null);
  };

  const handleFilteredCountChange = (count: number) => {
    setFilteredCount(count);
  };

  return (
    <>
      {/* Quick Navigation */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4 text-center">
          Sayfa Türleri
        </h2>
        
        {/* Filter Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Object.entries(PAGE_TYPE_CONFIG).map(([type, config]) => {
            const Icon = config.icon;
            const isSelected = selectedPageType === type;
            
            return (
              <button
                key={type}
                onClick={() => handlePageTypeFilter(type as ContentType)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePageTypeFilter(type as ContentType);
                  }
                }}
                className={`transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg ${
                  isSelected 
                    ? `${config.bgColor} ${config.borderColor} border-2 shadow-md scale-105` 
                    : 'hover:shadow-lg hover:scale-102'
                }`}
                aria-pressed={isSelected}
                aria-label={`${config.label} sayfalarını filtrele`}
              >
                <Card className={`cursor-pointer text-center border-0 ${isSelected ? 'shadow-none' : ''}`}>
                  <CardContent className="pt-3 pb-3">
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? config.color : 'text-primary'}`} />
                    <div className={`text-sm font-medium ${isSelected ? config.color : ''}`}>
                      {config.label}
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>

        {/* Active Filter Indicator */}
        {selectedPageType && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-sm font-medium text-primary">
                Filtre: {PAGE_TYPE_CONFIG[selectedPageType].label}
                {filteredCount !== null && ` (${filteredCount} sonuç)`}
              </span>
              <button
                onClick={handleClearFilter}
                className="text-primary hover:text-primary/80 text-sm font-medium underline"
              >
                Temizle
              </button>
            </div>
          </div>
        )}

        {/* App Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-primary mb-1">
                {stats.totalPages}
              </div>
              <div className="text-sm text-muted-foreground">
                Toplam Sayfa
              </div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-primary mb-1">
                {stats.totalUsers}
              </div>
              <div className="text-sm text-muted-foreground">Kullanıcı</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Published Pages */}
      <PublishedPagesSection
        initialPages={initialPages}
        initialPagination={initialPagination}
        selectedPageType={selectedPageType}
        onPageTypeChange={handlePageTypeFilter}
        onFilteredCountChange={handleFilteredCountChange}
      />
    </>
  );
}