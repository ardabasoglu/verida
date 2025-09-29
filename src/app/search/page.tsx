import { Suspense } from 'react';
import { Metadata } from 'next';
import SearchPage from '@/components/search/search-page';

export const metadata: Metadata = {
  title: 'Arama - Verida',
  description: 'Kurumsal bilgi bankasında arama yapın',
};

function SearchPageContent() {
  return <SearchPage />;
}

export default function Search() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
