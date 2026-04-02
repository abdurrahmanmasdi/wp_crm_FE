'use client';

import { useEffect, useState } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { productFormSchema, type LocalMediaItem, type ProductFormValues } from '../_schema';
import { productService, type CreateProductDto } from '@/lib/product.service';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import { ProductBasicsSection } from './ProductBasicsSection';
import { DynamicSpecsSection } from './DynamicSpecsSection';
import { AddonsSection } from './AddonsSection';

// ---------------------------------------------------------------------------
// Default values per product type (used on type switch to clear specs)
// ---------------------------------------------------------------------------
const TYPE_DEFAULTS: Record<ProductFormValues['type'], Partial<ProductFormValues>> = {
  REAL_ESTATE_ASSET: {
    type: 'REAL_ESTATE_ASSET',
    specifications: { bedrooms: 0, bathrooms: 0, square_meters: 10, year_built: 2000 },
  },
  SCHEDULED_EVENT: {
    type: 'SCHEDULED_EVENT',
    instance: { start_date: '', end_date: '', max_capacity: 10 },
    specifications: { duration_hours: 1, meeting_point: '', difficulty_level: 'MEDIUM' },
  },
  RESOURCE_RENTAL: {
    type: 'RESOURCE_RENTAL',
    specifications: { transmission: 'AUTOMATIC', fuel_type: '', seats: 4 },
  },
  DYNAMIC_SERVICE: {
    type: 'DYNAMIC_SERVICE',
    specifications: { base_fee: 0 },
  },
};

// ---------------------------------------------------------------------------
// Payload builder — maps form values → backend DTO
// ---------------------------------------------------------------------------
function buildPayload(
  data: ProductFormValues,
  mediaItems: LocalMediaItem[]
): CreateProductDto {
  // Merge extra_specifications key-value pairs into the specifications object
  const extraEntries = (data.extra_specifications ?? []).reduce<
    Record<string, string>
  >((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {});

  const specifications = { ...data.specifications, ...extraEntries };

  // Media — primary item goes first so backend auto-sets is_primary on it
  const primaryMedia = mediaItems.filter((m) => m.isPrimary);
  const restMedia = mediaItems.filter((m) => !m.isPrimary);
  const orderedMedia = [...primaryMedia, ...restMedia];

  const media = orderedMedia.map((m) => ({
    file_url: m.previewUrl, // TODO: replace with upload CDN URLs when upload endpoint is available
    file_name: m.file.name,
  }));

  // Instances — only for SCHEDULED_EVENT (one slot per creation)
  const instances =
    data.type === 'SCHEDULED_EVENT'
      ? [
          {
            start_date: new Date(data.instance.start_date).toISOString(),
            end_date: new Date(data.instance.end_date).toISOString(),
            max_capacity: data.instance.max_capacity,
          },
        ]
      : [];

  return {
    type: data.type,
    title: data.title,
    description: data.description,
    base_price: data.base_price,
    currency: data.currency,
    specifications,
    available_addons: data.available_addons,
    media: media.length > 0 ? media : undefined,
    instances: instances.length > 0 ? instances : undefined,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CreateProductForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeOrganizationId = useAuthStore((s) => s.activeOrganizationId);

  // Gallery state is kept outside react-hook-form (File objects aren't serialisable)
  const [mediaItems, setMediaItems] = useState<LocalMediaItem[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      type: 'REAL_ESTATE_ASSET',
      title: '',
      description: '',
      base_price: 0,
      currency: 'USD',
      available_addons: [],
      extra_specifications: [],
      specifications: { bedrooms: 0, bathrooms: 0, square_meters: 10, year_built: 2000 },
    } as ProductFormValues,
  });

  const selectedType = useWatch({ control: form.control, name: 'type' });

  // When type changes, reset only type-specific fields, preserving shared ones
  useEffect(() => {
    const preserved = {
      title: form.getValues('title'),
      description: form.getValues('description'),
      base_price: form.getValues('base_price'),
      currency: form.getValues('currency'),
      available_addons: form.getValues('available_addons'),
      extra_specifications: form.getValues('extra_specifications'),
    };
    form.reset({ ...preserved, ...TYPE_DEFAULTS[selectedType] } as ProductFormValues);
  }, [selectedType]); // intentionally omitting form

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const payload = buildPayload(data, mediaItems);
      await productService.create(payload);

      // Invalidate products list
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all(activeOrganizationId),
      });

      toast.success('Product created successfully!');
      router.push('../products'); // navigate back to list
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? 'Failed to create product. Please try again.';
      toast.error(message);
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <FormProvider {...form}>
      {/* Page header */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Create New Product</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Design and configure your dynamic product offerings for any industry.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
        {/* Section 1 – Basics + Gallery */}
        <ProductBasicsSection
          mediaItems={mediaItems}
          onMediaChange={setMediaItems}
        />

        {/* Section 2 – Specs (animated on type change) */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`specs-${selectedType}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, filter: 'blur(4px)', scale: 0.99 }}
            transition={{ duration: 0.22 }}
          >
            <DynamicSpecsSection />
          </motion.div>
        </AnimatePresence>

        {/* Section 3 – Add-ons */}
        <AddonsSection />

        {/* ─── Footer actions ─────────────────────────────────────────────── */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            Discard Draft
          </button>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-xl border border-border px-8 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-all hover:bg-muted"
            >
              Save as Template
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-primary px-10 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-[0_10px_24px_-10px_hsl(var(--primary)/0.4)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Publishing…
                </>
              ) : (
                'Activate & List Product'
              )}
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
