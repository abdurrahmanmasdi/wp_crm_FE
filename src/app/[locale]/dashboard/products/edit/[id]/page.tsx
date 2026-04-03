'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { ProductForm } from '../../_components/CreateProductForm';
import { productService, type Product } from '@/lib/product.service';
import { type ProductFormValues, type LocalMediaItem, type ProductType, type ExtraSpecFormValues } from '../../_schema';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';

// We map standard spec keys depending on real ProductType so we know
// which ones to inject into the defined zod schema and which to push to extra_specifications
const STANDARD_SPECS_KEYS = {
  REAL_ESTATE_ASSET: ['bedrooms', 'bathrooms', 'square_meters', 'year_built'],
  SCHEDULED_EVENT: ['duration_hours', 'meeting_point', 'difficulty_level'],
  RESOURCE_RENTAL: ['transmission', 'fuel_type', 'seats', 'daily_limit_km'],
  DYNAMIC_SERVICE: ['base_fee', 'price_per_km', 'hourly_rate'],
};

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();
  const activeOrganizationId = useAuthStore(s => s.activeOrganizationId);

  // Fetch product data
  const { data: product, isLoading, error } = useQuery({
    queryKey: queryKeys.products.detail(activeOrganizationId, productId),
    queryFn: () => productService.getById(productId),
  });

  const [initialData, setInitialData] = useState<ProductFormValues | null>(null);
  const [initialMedia, setInitialMedia] = useState<LocalMediaItem[] | null>(null);

  useEffect(() => {
    if (product) {
      const type = product.type as ProductType;
      const rawSpecs = product.specifications || {};
      const standardKeysForType = STANDARD_SPECS_KEYS[type] || [];
      
      const specifications: Record<string, any> = {};
      const extra_specifications: ExtraSpecFormValues[] = [];

      for (const [k, v] of Object.entries(rawSpecs)) {
        if (standardKeysForType.includes(k)) {
          specifications[k] = v;
        } else {
          extra_specifications.push({ key: k, value: String(v) });
        }
      }

      let instanceData = undefined;
      if (type === 'SCHEDULED_EVENT' && product.instances && product.instances.length > 0) {
        const firstInst = product.instances[0];
        // Ensure datetime strings are formatted for input[type="datetime-local"]
        // The backend returns ISO string e.g. "2026-05-01T00:00:00.000Z"
        // We slice 0, 16 for "YYYY-MM-DDTHH:mm"
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

      // Prepare initial Values for the form
      const formValues = {
        type: type,
        title: product.title,
        description: product.description || '',
        base_price: Number(product.base_price),
        currency: product.currency || 'USD',
        available_addons: product.available_addons || [],
        specifications: specifications,
        extra_specifications: extra_specifications,
        // Using "as any" to bypass strict discriminated union structural limits locally while injecting instanceData safely
        ...(instanceData ? { instance: instanceData } : {}),
      } as unknown as ProductFormValues;

      setInitialData(formValues);

      // Map backend media arrays to the frontend's LocalMediaItem structure
      // Faking File object to comply with local preview requirements
      const mappedMedia: LocalMediaItem[] = (product.media || []).map((m) => ({
        previewUrl: m.file_url,
        file: new File([""], m.file_name || 'image.jpg', { type: 'image/jpeg' }),
        isPrimary: m.is_primary,
      }));

      setInitialMedia(mappedMedia);
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-zinc-500 font-medium tracking-wide animate-pulse">Loading Product Configuration...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-400 font-medium">Failed to load product details.</p>
        <Link href="/dashboard/products" className="text-primary hover:underline text-sm font-semibold flex items-center gap-2">
           <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
      </div>
    );
  }

  if (!initialData || !initialMedia) return null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 pb-24 md:px-10">
      <Link
        href="/dashboard/products"
        className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground hover:bg-zinc-900/50 p-2 rounded-lg -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Catalog
      </Link>

      <ProductForm 
        productId={productId} 
        initialData={initialData} 
        initialMedia={initialMedia} 
      />
    </div>
  );
}
