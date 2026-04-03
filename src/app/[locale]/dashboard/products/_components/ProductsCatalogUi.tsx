'use client';

import { useTranslations } from 'next-intl';
import { LayoutGrid, List as ListIcon, Search } from 'lucide-react';

export function ProductsToolbar({
  viewMode,
  setViewMode,
}: {
  viewMode: 'GRID' | 'LIST';
  setViewMode: (m: 'GRID' | 'LIST') => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-end">
      <div className="flex items-center rounded-lg border border-white/10 bg-zinc-900 p-1">
        <button
          onClick={() => setViewMode('GRID')}
          className={`rounded-md p-1.5 transition-colors ${
            viewMode === 'GRID'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          onClick={() => setViewMode('LIST')}
          className={`rounded-md p-1.5 transition-colors ${
            viewMode === 'LIST'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ListIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ viewMode }: { viewMode: 'GRID' | 'LIST' }) {
  if (viewMode === 'GRID') {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex h-80 animate-pulse flex-col overflow-hidden rounded-xl border border-white/5 bg-zinc-900"
          >
            <div className="h-48 w-full bg-zinc-800" />
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="h-5 w-3/4 rounded bg-zinc-800" />
              <div className="flex gap-2">
                <div className="h-4 w-16 rounded bg-zinc-800" />
                <div className="h-4 w-16 rounded bg-zinc-800" />
              </div>
              <div className="mt-auto border-t border-white/5 pt-4">
                <div className="h-6 w-1/3 rounded bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex h-24 animate-pulse items-center gap-4 rounded-xl border border-white/5 bg-zinc-900 p-3"
        >
          <div className="h-16 w-16 shrink-0 rounded-lg bg-zinc-800 sm:h-20 sm:w-20" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-1/3 rounded bg-zinc-800" />
            <div className="h-3 w-1/4 rounded bg-zinc-800" />
          </div>
          <div className="mr-4 h-8 w-24 rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState() {
  const t = useTranslations('Products');
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 px-4 py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/5 bg-zinc-800">
        <Search className="h-8 w-8 text-zinc-500" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-zinc-100">
        {t('noProductsFound')}
      </h3>
      <p className="mb-6 max-w-sm text-sm text-zinc-400">
        {t('noProductsDescription')}
      </p>
    </div>
  );
}
