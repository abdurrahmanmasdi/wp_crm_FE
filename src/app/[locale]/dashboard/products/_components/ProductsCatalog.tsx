'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/usePermissions';
import {
  serializeProductFiltersParam,
  type ProductFilterRule,
  ProductFiltersBar,
} from '@/components/products/filters/ProductFiltersBar';
import { productService } from '@/lib/product.service';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import { ProductCard } from './ProductCard';
import { ProductDetailsDrawer } from './ProductDrawer';
import { ProductListRow } from './ProductListRow';
import {
  EmptyState,
  LoadingSkeleton,
  ProductsToolbar,
  ProductsPagination,
} from './ProductsCatalogUi';
import type { Product } from './product-types';

type ProductSortBy = 'title' | 'base_price' | 'created_at';

const ITEMS_PER_PAGE = 12;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = ITEMS_PER_PAGE;

function buildSortsParam(
  sortBy: ProductSortBy | null,
  sortDir: 'asc' | 'desc' | null
): string | null {
  if (!sortBy || !sortDir) {
    return null;
  }

  const sorts = [{ field: sortBy, direction: sortDir }];
  return JSON.stringify(sorts);
}

export default function ProductsCatalog() {
  const t = useTranslations('Products');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const activeOrganizationId = useAuthStore((s) => s.activeOrganizationId);

  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterRules, setFilterRules] = useState<ProductFilterRule[]>([]);

  // Parse URL params
  const currentPage = useMemo(() => {
    const page = searchParams.get('page');
    return page ? Math.max(1, parseInt(page, 10)) : DEFAULT_PAGE;
  }, [searchParams]);

  const currentLimit = useMemo(() => {
    const limit = searchParams.get('limit');
    return limit ? Math.max(1, parseInt(limit, 10)) : DEFAULT_LIMIT;
  }, [searchParams]);

  const sortBy = useMemo(() => {
    const sort = searchParams.get('sortBy');
    return sort && ['title', 'base_price', 'created_at'].includes(sort)
      ? (sort as ProductSortBy)
      : null;
  }, [searchParams]);

  const sortDir = useMemo(() => {
    const dir = searchParams.get('sortDir');
    return dir === 'asc' || dir === 'desc' ? dir : null;
  }, [searchParams]);

  const debouncedFilterRules = useDebounce(filterRules, 600);

  const filtersQueryParam = useMemo(() => {
    const serialized = serializeProductFiltersParam(debouncedFilterRules);
    return serialized ?? '';
  }, [debouncedFilterRules]);

  const sortsParam = useMemo(() => {
    return buildSortsParam(sortBy, sortDir);
  }, [sortBy, sortDir]);

  const handleRulesChange = useCallback(
    (rules: ProductFilterRule[]) => {
      setFilterRules(rules);
      // Reset to page 1 when filters change
      const params = new URLSearchParams(searchParams);
      params.set('page', '1');
      router.replace(`?${params.toString()}`, { scroll: false } as Parameters<
        typeof router.replace
      >[1]);
    },
    [searchParams, router]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', String(page));
      router.replace(`?${params.toString()}`, { scroll: false } as Parameters<
        typeof router.replace
      >[1]);
    },
    [searchParams, router]
  );

  const handleSortChange = useCallback(
    (field: ProductSortBy | null, direction: 'asc' | 'desc' | null) => {
      const params = new URLSearchParams(searchParams);
      if (field && direction) {
        params.set('sortBy', field);
        params.set('sortDir', direction);
      } else {
        params.delete('sortBy');
        params.delete('sortDir');
      }
      params.set('page', '1');
      router.replace(`?${params.toString()}`, { scroll: false } as Parameters<
        typeof router.replace
      >[1]);
    },
    [searchParams, router]
  );

  const { data: responseData, isLoading } = useQuery({
    queryKey: [
      ...queryKeys.products.all(activeOrganizationId),
      filtersQueryParam,
      sortsParam,
      currentPage,
      currentLimit,
    ],
    queryFn: async () => {
      if (!activeOrganizationId) {
        throw new Error('Active organization is required');
      }

      return productService.getAll(activeOrganizationId, {
        page: currentPage,
        limit: currentLimit,
        filters: filtersQueryParam,
        sorts: sortsParam ?? undefined,
      });
    },
    enabled: !!activeOrganizationId,
  });

  const products: Product[] = Array.isArray(responseData)
    ? (responseData as unknown as Product[])
    : ((responseData?.data as unknown as Product[]) ?? []);

  const meta = responseData?.meta ?? {
    page: 1,
    limit: currentLimit,
    total: 0,
    totalPages: 1,
  };

  const canCreate = hasPermission('products', 'create');

  return (
    <div className="mx-auto min-h-screen max-w-350 px-6 py-8 pb-24 md:px-10 lg:px-12">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-white">
            {t('title')}
          </h1>
          <p className="text-sm text-zinc-400">{t('subtitle')}</p>
        </div>

        {canCreate && (
          <Link
            href="/dashboard/products/create"
            className="bg-primary text-primary-foreground flex shrink-0 items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-[0_4px_14px_0_hsl(var(--primary)/20%)] transition-all hover:brightness-110 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            {t('newProduct')}
          </Link>
        )}
      </div>

      <ProductFiltersBar
        initialRules={filterRules}
        onRulesChange={handleRulesChange}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleSortChange}
      />
      <ProductsToolbar viewMode={viewMode} setViewMode={setViewMode} />

      <ProductDetailsDrawer
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {isLoading ? (
        <LoadingSkeleton viewMode={viewMode} />
      ) : products.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {viewMode === 'GRID' ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {products.map((product) => (
                  <ProductListRow
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {meta.totalPages > 1 && (
            <ProductsPagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
