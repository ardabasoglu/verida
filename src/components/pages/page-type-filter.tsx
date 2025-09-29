'use client';

import { ContentType } from '@prisma/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PageTypeFilterProps {
  selectedType: ContentType | '';
  onTypeChange: (type: ContentType | '') => void;
  className?: string;
}

const PAGE_TYPE_CONFIG = {
  INFO: {
    label: 'Bilgi',
    description: 'Genel bilgi ve dokümantasyon',
    color:
      'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/30',
    icon: '📚',
  },
  PROCEDURE: {
    label: 'Prosedür',
    description: 'İş süreçleri ve prosedürler',
    color:
      'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/30',
    icon: '⚙️',
  },
  ANNOUNCEMENT: {
    label: 'Duyuru',
    description: 'Önemli duyurular ve haberler',
    color:
      'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800 dark:hover:bg-yellow-900/30',
    icon: '📢',
  },
  WARNING: {
    label: 'Uyarı',
    description: 'Kritik uyarılar ve bildirimler',
    color:
      'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/30',
    icon: '⚠️',
  },
};

export function PageTypeFilter({
  selectedType,
  onTypeChange,
  className = '',
}: PageTypeFilterProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-card-foreground">
        Sayfa Tipleri
      </h3>

      <RadioGroup
        value={selectedType}
        onValueChange={(value) => onTypeChange(value as ContentType | '')}
        className="space-y-3"
      >
        {/* All Pages Option */}
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="" id="all-pages" />
          <label
            htmlFor="all-pages"
            className="flex-1 cursor-pointer p-4 rounded-lg border-2 transition-all hover:border-primary/50 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <div className="font-medium text-card-foreground">
                  Tüm Sayfalar
                </div>
                <div className="text-sm text-muted-foreground">
                  Bütün sayfa tiplerini göster
                </div>
              </div>
            </div>
          </label>
        </div>

        {/* Individual Page Types */}
        {Object.entries(PAGE_TYPE_CONFIG).map(([type, config]) => (
          <div key={type} className="flex items-center space-x-3">
            <RadioGroupItem value={type} id={`page-type-${type}`} />
            <label
              htmlFor={`page-type-${type}`}
              className="flex-1 cursor-pointer p-4 rounded-lg border-2 transition-all hover:border-primary/50 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div>
                  <div className="font-medium text-card-foreground">
                    {config.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {config.description}
                  </div>
                </div>
              </div>
            </label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
