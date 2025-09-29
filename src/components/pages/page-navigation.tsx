'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContentType } from '@prisma/client';
import { PageWithRelations } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface PageNavigationProps {
  onFilterChange?: (filters: {
    query: string;
    pageType: ContentType | '';
    sortBy: string;
    sortOrder: string;
  }) => void;
  totalPages?: number;
  className?: string;
}

const PAGE_TYPE_OPTIONS = [
  { value: '', label: 'Tüm Tipler', icon: '📋' },
  { value: 'INFO', label: 'Bilgi', icon: '📚' },
  { value: 'PROCEDURE', label: 'Prosedür', icon: '⚙️' },
  { value: 'ANNOUNCEMENT', label: 'Duyuru', icon: '📢' },
  { value: 'WARNING', label: 'Uyarı', icon: '⚠️' },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Tarihe Göre' },
  { value: 'title', label: 'Başlığa Göre' },
  { value: 'pageType', label: 'Tipe Göre' },
  { value: 'author', label: 'Yazara Göre' },
];

export function PageNavigation({
  onFilterChange,
  totalPages = 0,
  className = '',
}: PageNavigationProps) {
  const [filters, setFilters] = useState({
    query: '',
    pageType: '' as ContentType | '',
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange?.(filters);
  };

  return (
    <div
      className={`bg-card rounded-lg shadow-sm border border-border ${className}`}
    >
      {/* Main Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
        {/* Quick Search */}
        <form onSubmit={handleQuickSearch} className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={filters.query}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, query: e.target.value }))
              }
              placeholder="Sayfa ara..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-border text-foreground hover:bg-muted'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Filtreler</span>
          </button>

          <Link
            href="/pages/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Yeni Sayfa</span>
            <span className="sm:hidden">Yeni</span>
          </Link>
        </div>
      </div>

      {/* Extended Filters */}
      {showFilters && (
        <div className="border-t border-border p-4 bg-muted">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Page Type Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sayfa Tipi
              </label>
              <RadioGroup
                value={filters.pageType || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    pageType: value === 'all' ? '' : (value as ContentType),
                  }))
                }
                className="space-y-2"
              >
                {PAGE_TYPE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={option.value}
                      id={`pageType-${option.value}`}
                    />
                    <label
                      htmlFor={`pageType-${option.value}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span className="text-sm text-foreground">
                        {option.label}
                      </span>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sıralama
              </label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, sortBy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sıralama seçin" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-2">
                <RadioGroup
                  value={filters.sortOrder}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, sortOrder: value }))
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-1">
                    <RadioGroupItem value="desc" id="sortOrder-desc" />
                    <label
                      htmlFor="sortOrder-desc"
                      className="text-sm text-foreground cursor-pointer"
                    >
                      Azalan
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    <RadioGroupItem value="asc" id="sortOrder-asc" />
                    <label
                      htmlFor="sortOrder-asc"
                      className="text-sm text-foreground cursor-pointer"
                    >
                      Artan
                    </label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Quick Stats */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                İstatistikler
              </label>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Toplam Sayfa:</span>
                  <span className="font-medium">{totalPages}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aktif Filtre:</span>
                  <span className="font-medium">
                    {filters.pageType
                      ? PAGE_TYPE_OPTIONS.find(
                          (opt) => opt.value === filters.pageType
                        )?.label
                      : 'Yok'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={() =>
                setFilters({
                  query: '',
                  pageType: '',
                  sortBy: 'date',
                  sortOrder: 'desc',
                })
              }
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Tüm filtreleri temizle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
