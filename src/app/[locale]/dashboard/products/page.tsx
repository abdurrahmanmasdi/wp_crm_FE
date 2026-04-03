'use client';

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/usePermissions';
import { productService } from '@/lib/product.service';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import { ProductCard } from './_components/ProductCard';
import { ProductDetailsDrawer } from './_components/ProductDrawer';
import { ProductListRow } from './_components/ProductListRow';
import {
  EmptyState,
  LoadingSkeleton,
  ProductsToolbar,
} from './_components/ProductsCatalogUi';
import { ProductsFilterBar } from './_components/ProductsFilterBar';
import type { FilterNode, Product } from './_components/product-types';

export default function ProductsCatalogPage() {
  const t = useTranslations('Products');
  const { hasPermission } = usePermissions();
  const activeOrganizationId = useAuthStore((s) => s.activeOrganizationId);

  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<FilterNode[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedFilters = useDebounce(filters, 600);
  const itemsPerPage = 12;

  const filtersQueryParam = useMemo(
    () => encodeURIComponent(JSON.stringify(debouncedFilters)),
    [debouncedFilters]
  );

  const handleSetFilters: Dispatch<SetStateAction<FilterNode[]>> = (update) => {
    setCurrentPage(1);
    setFilters(update);
  };

  const { data: responseData, isLoading } = useQuery({
    queryKey: [
      ...queryKeys.products.all(activeOrganizationId),
      filtersQueryParam,
      currentPage,
      itemsPerPage,
    ],
    queryFn: async () => {
      if (!activeOrganizationId) {
        throw new Error('Active organization is required');
      }

      return productService.getAll(activeOrganizationId, {
        page: currentPage,
        limit: itemsPerPage,
        filters: filtersQueryParam,
      });
    },
    enabled: !!activeOrganizationId,
  });

  const products: Product[] = Array.isArray(responseData)
    ? (responseData as unknown as Product[])
    : ((responseData?.data as unknown as Product[]) ?? []);

  const meta = responseData?.meta ?? {
    page: 1,
    limit: itemsPerPage,
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

      <ProductsFilterBar filters={filters} setFilters={handleSetFilters} />
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
            <Pagination className="mt-8 opacity-90 transition-opacity hover:opacity-100">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={
                      currentPage === 1
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>

                {Array.from({ length: meta.totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={currentPage === i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((p) => Math.min(meta.totalPages, p + 1))
                    }
                    className={
                      currentPage === meta.totalPages
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
