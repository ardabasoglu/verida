'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ContentType } from '@prisma/client';
import { PageWithRelations } from '@/types';
import SearchBar from './search-bar';
import SearchResults from './search-results';

interface SearchFilters {
  pageType?: ContentType;
  tags?: string[];
  authorId?: string;
  sortBy?: 'relevance' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface SearchParams {
  query: string;
  filters: SearchFilters;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [results, setResults] = useState<PageWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Get initial search parameters from URL
  const getInitialParams = useCallback((): SearchParams => {
    const query = searchParams.get('q') || '';
    const pageType = (searchParams.get('type') as ContentType) || undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const authorId = searchParams.get('author') || undefined;
    const sortBy =
      (searchParams.get('sort') as 'relevance' | 'date' | 'title') ||
      'relevance';
    const sortOrder = (searchParams.get('order') as 'asc' | 'desc') || 'desc';

    return {
      query,
      filters: {
        pageType,
        tags: tags.length > 0 ? tags : undefined,
        authorId,
        sortBy,
        sortOrder,
      },
    };
  }, [searchParams]);

  // Update URL with search parameters
  const updateURL = useCallback(
    (params: SearchParams, page: number = 1) => {
      const urlParams = new URLSearchParams();

      if (params.query) urlParams.set('q', params.query);
      if (params.filters.pageType)
        urlParams.set('type', params.filters.pageType);
      if (params.filters.tags?.length)
        urlParams.set('tags', params.filters.tags.join(','));
      if (params.filters.authorId)
        urlParams.set('author', params.filters.authorId);
      if (params.filters.sortBy && params.filters.sortBy !== 'relevance') {
        urlParams.set('sort', params.filters.sortBy);
      }
      if (params.filters.sortOrder && params.filters.sortOrder !== 'desc') {
        urlParams.set('order', params.filters.sortOrder);
      }
      if (page > 1) urlParams.set('page', page.toString());

      const newURL = `/search${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
      router.push(newURL, { scroll: false });
    },
    [router]
  );

  // Perform search
  const performSearch = useCallback(
    async (params: SearchParams, page: number = 1) => {
      setLoading(true);
      setError(null);

      try {
        const searchURL = new URLSearchParams();

        if (params.query) searchURL.set('query', params.query);
        if (params.filters.pageType)
          searchURL.set('pageType', params.filters.pageType);
        if (params.filters.tags?.length)
          searchURL.set('tags', params.filters.tags.join(','));
        if (params.filters.authorId)
          searchURL.set('authorId', params.filters.authorId);
        if (params.filters.sortBy)
          searchURL.set('sortBy', params.filters.sortBy);
        if (params.filters.sortOrder)
          searchURL.set('sortOrder', params.filters.sortOrder);
        searchURL.set('page', page.toString());
        searchURL.set('limit', '10');

        const response = await fetch(`/api/search?${searchURL.toString()}`);

        if (!response.ok) {
          throw new Error('Arama sırasında hata oluştu');
        }

        const result = await response.json();

        if (result.success) {
          setResults(result.data);
          setPagination(result.pagination);
        } else {
          throw new Error(result.error || 'Bir hata oluştu');
        }
      } catch (error) {
        console.error('Search error:', error);
        setError(
          error instanceof Error ? error.message : 'Arama sırasında hata oluştu'
        );
        setResults([]);
        setPagination({ page: 1, limit: 10, total: 0, totalPages: 0 });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Handle search from SearchBar
  const handleSearch = useCallback(
    (params: SearchParams) => {
      updateURL(params, 1);
      performSearch(params, 1);
    },
    [updateURL, performSearch]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      const currentParams = getInitialParams();
      updateURL(currentParams, page);
      performSearch(currentParams, page);
    },
    [getInitialParams, updateURL, performSearch]
  );

  // Initial search on component mount and URL changes
  useEffect(() => {
    const params = getInitialParams();
    const page = parseInt(searchParams.get('page') || '1');

    // Only perform search if there are search parameters
    if (
      params.query ||
      params.filters.pageType ||
      params.filters.tags?.length ||
      params.filters.authorId
    ) {
      performSearch(params, page);
    }
  }, [searchParams, getInitialParams, performSearch]);

  const initialParams = getInitialParams();

  return (
    <div>
      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        initialQuery={initialParams.query}
        initialFilters={initialParams.filters}
        showAdvancedFilters={true}
        loading={loading}
      />

      {/* Search Results */}
      <SearchResults
        results={results}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchQuery={initialParams.query}
      />
    </div>
  );
}
