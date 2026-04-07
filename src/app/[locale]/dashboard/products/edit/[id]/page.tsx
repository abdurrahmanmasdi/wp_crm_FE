'use client';

import { use, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { ProductForm } from '../../_components/CreateProductForm';
import { productService } from '@/lib/product.service';
import {
  type ProductFormValues,
  type LocalMediaItem,
  type ProductType,
  type ExtraSpecFormValues,
} from '../../_schema';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';

// We map standard spec keys depending on real ProductType so we know
// which ones to inject into the defined zod schema and which to push to extra_specifications
const STANDARD_SPECS_KEYS = {
  REAL_ESTATE_ASSET: ['bedrooms', 'bathrooms', 'square_meters', 'year_built'],
  SCHEDULED_EVENT: ['duration_hours', 'meeting_point', 'difficulty_level'],
  RESOURCE_RENTAL: ['transmission', 'fuel_type', 'seats', 'daily_limit_km'],
  DYNAMIC_SERVICE: ['base_fee', 'price_per_km', 'hourly_rate'],
} as const;

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const activeOrganizationId = useAuthStore((s) => s.activeOrganizationId);

  // Fetch product data
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.products.detail(activeOrganizationId, productId),
    queryFn: () => {
      if (!activeOrganizationId) {
        throw new Error('Active organization is required');
      }

      return productService.getById(activeOrganizationId, productId);
    },
    enabled: !!activeOrganizationId && !!productId,
  });

  const initialFormData = useMemo(() => {
    if (!product) {
      return null;
    }

    const type = product.type as ProductType;
    const rawSpecs = product.specifications || {};
    const standardKeysForType = new Set<string>(STANDARD_SPECS_KEYS[type]);

    const specifications: Record<string, unknown> = {};
    const extra_specifications: ExtraSpecFormValues[] = [];

    for (const [k, v] of Object.entries(rawSpecs)) {
      if (standardKeysForType.has(k)) {
        specifications[k] = v;
      } else {
        extra_specifications.push({ key: k, value: String(v) });
      }
    }

    let instanceData:
      | { start_date: string; end_date: string; max_capacity: number }
      | undefined;
    if (type === 'SCHEDULED_EVENT' && product.instances?.length) {
      const firstInst = product.instances[0];
      const formatForInput = (isoString: string) => {
        try {
          return new Date(isoString).toISOString().slice(0, 16);
        } catch {
          return isoString;
        }
      };

      instanceData = {
        start_date: formatForInput(firstInst.start_date),
        end_date: formatForInput(firstInst.end_date),
        max_capacity: firstInst.max_capacity,
      };
    }

    const initialData = {
      type,
      title: product.title,
      description: product.description || '',
      base_price: Number(product.base_price),
      currency: product.currency || 'USD',
      available_addons: product.available_addons || [],
      specifications,
      extra_specifications,
      ...(instanceData ? { instance: instanceData } : {}),
    } as unknown as ProductFormValues;

    const initialMedia: LocalMediaItem[] = (product.media || []).map((m) => ({
      mediaId: m.id,
      previewUrl: m.file_url,
      isPrimary: m.is_primary,
    }));

    return { initialData, initialMedia };
  }, [product]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="text-primary mb-4 h-8 w-8 animate-spin" />
        <p className="animate-pulse font-medium tracking-wide text-zinc-500">
          Loading Product Configuration...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="font-medium text-red-400">
          Failed to load product details.
        </p>
        <Link
          href="/dashboard/products"
          className="text-primary flex items-center gap-2 text-sm font-semibold hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
      </div>
    );
  }

  if (!initialFormData) return null;

  return (
    <div className="mx-auto px-6 py-8 pb-24 md:px-10">
      <Link
        href="/dashboard/products"
        className="text-muted-foreground hover:text-foreground mb-8 -ml-2 inline-flex items-center gap-2 rounded-lg p-2 text-xs font-bold tracking-widest uppercase transition-colors hover:bg-zinc-900/50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Catalog
      </Link>

      <ProductForm
        productId={productId}
        initialData={initialFormData.initialData}
        initialMedia={initialFormData.initialMedia}
      />
    </div>
  );
}
