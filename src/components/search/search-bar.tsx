'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ContentType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  onSearch: (params: SearchParams) => void;
  initialQuery?: string;
  initialFilters?: SearchFilters;
  showAdvancedFilters?: boolean;
  loading?: boolean;
}

interface SearchParams {
  query: string;
  filters: SearchFilters;
}

interface SearchFilters {
  pageType?: ContentType;
  tags?: string[];
  authorId?: string;
  sortBy?: 'relevance' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface TagSuggestion {
  tag: string;
  count: number;
}

const PAGE_TYPE_LABELS = {
  INFO: 'Bilgi',
  PROCEDURE: 'Prosedür',
  ANNOUNCEMENT: 'Duyuru',
  WARNING: 'Uyarı',
};

export default function SearchBar({
  onSearch,
  initialQuery = '',
  initialFilters = {},
  showAdvancedFilters = true,
  loading = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialFilters.tags || []
  );

  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch tag suggestions
  const fetchTagSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setTagSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/tags?query=${encodeURIComponent(searchQuery)}&limit=10`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTagSuggestions(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
    }
  }, []);

  // Debounced tag search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tagInput) {
        fetchTagSuggestions(tagInput);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [tagInput, fetchTagSuggestions]);

  // Handle search submission
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSearch({
      query: query.trim(),
      filters: {
        ...filters,
        tags: selectedTags,
      },
    });
  };

  // Handle tag selection
  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
    setTagSuggestions([]);
  };

  // Handle tag removal
  const handleTagRemove = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  // Handle tag input key events
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
        setSelectedTags((prev) => [...prev, tagInput.trim()]);
        setTagInput('');
        setShowTagSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
      setTagInput('');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setQuery('');
    setFilters({});
    setSelectedTags([]);
    setTagInput('');
    onSearch({ query: '', filters: {} });
  };

  // Check if any filters are active
  const hasActiveFilters =
    query || filters.pageType || selectedTags.length > 0 || filters.authorId;

  return (
    <div className="bg-card rounded-lg shadow-md p-6 mb-6">
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Main search input */}
        <div className="relative">
          <div className="flex shadow-sm">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-l-md rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-r-0"
                placeholder="Başlık, içerik veya etiket ara..."
              />
            </div>
            <Button
              type="submit"
              variant="default"
              size="default"
              loading={loading}
              loadingText="Aranıyor..."
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-l-none rounded-r-md px-6 py-3 h-auto border-l-0 shadow-sm"
            >
              Ara
            </Button>
          </div>
        </div>

        {/* Advanced filters toggle */}
        {showAdvancedFilters && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showFilters ? 'Filtreleri Gizle' : 'Gelişmiş Filtreler'}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <XMarkIcon className="h-4 w-4" />
                Filtreleri Temizle
              </button>
            )}
          </div>
        )}

        {/* Advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border">
            {/* Page Type Filter */}
            <div>
              <label
                htmlFor="pageType"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Sayfa Tipi
              </label>
              <Select
                value={filters.pageType || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    pageType:
                      value === 'all' ? undefined : (value as ContentType),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tüm Tipler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Tipler</SelectItem>
                  {Object.entries(PAGE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <label
                htmlFor="sortBy"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Sıralama
              </label>
              <Select
                value={filters.sortBy || 'relevance'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: value as 'relevance' | 'date' | 'title',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sıralama seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">İlgililik</SelectItem>
                  <SelectItem value="date">Tarih</SelectItem>
                  <SelectItem value="title">Başlık</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div>
              <label
                htmlFor="sortOrder"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Sıra
              </label>
              <Select
                value={filters.sortOrder || 'desc'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortOrder: value as 'asc' | 'desc',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sıra seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Azalan</SelectItem>
                  <SelectItem value="asc">Artan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Tag input with autocomplete */}
        {showFilters && (
          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Etiketler
            </label>

            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag input */}
            <div className="relative">
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowTagSuggestions(true);
                }}
                onKeyDown={handleTagInputKeyDown}
                onFocus={() => setShowTagSuggestions(true)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Etiket ara veya yeni etiket ekle..."
              />

              {/* Tag suggestions */}
              {showTagSuggestions && tagSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
                >
                  {tagSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.tag}
                      type="button"
                      onClick={() => handleTagSelect(suggestion.tag)}
                      className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between"
                    >
                      <span>#{suggestion.tag}</span>
                      <span className="text-xs text-muted-foreground">
                        {suggestion.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
