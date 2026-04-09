'use client';

import { useEffect, useState, useRef } from 'react';
import {
  useForm,
  FormProvider,
  useWatch,
  type Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  productFormSchema,
  type LocalMediaItem,
  type ProductFormValues,
} from '../_schema';
import { productService, type CreateProductDto } from '@/lib/api/products';
import { getErrorMessage } from '@/lib/error-utils';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import { ProductBasicsSection } from './ProductBasicsSection';
import { DynamicSpecsSection } from './DynamicSpecsSection';
import { AddonsSection } from './AddonsSection';
import { setProductPrimaryMedia } from '@/lib/api/products';

// ---------------------------------------------------------------------------
// Default values per product type (used on type switch to clear specs)
// ---------------------------------------------------------------------------
const TYPE_DEFAULTS: Record<
  ProductFormValues['type'],
  Partial<ProductFormValues>
> = {
  REAL_ESTATE_ASSET: {
    type: 'REAL_ESTATE_ASSET',
    specifications: {
      bedrooms: 0,
      bathrooms: 0,
      square_meters: 10,
      year_built: 2000,
    },
  },
  SCHEDULED_EVENT: {
    type: 'SCHEDULED_EVENT',
    instance: { start_date: '', end_date: '', max_capacity: 10 },
    specifications: {
      duration_hours: 1,
      meeting_point: '',
      difficulty_level: 'MEDIUM',
    },
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
// Excludes media items (handled separately in two-step upload)
// ---------------------------------------------------------------------------
function buildPayload(data: ProductFormValues): CreateProductDto {
  // Merge extra_specifications key-value pairs into the specifications object
  const extraEntries = (data.extra_specifications ?? []).reduce<
    Record<string, string>
  >((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {});

  const specifications = { ...data.specifications, ...extraEntries };

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
    instances: instances.length > 0 ? instances : undefined,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ProductForm({
  productId,
  initialData,
  initialMedia = [],
}: {
  productId?: string;
  initialData?: ProductFormValues;
  initialMedia?: LocalMediaItem[];
}) {
  const isEditMode = !!productId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeOrganizationId = useAuthStore((s) => s.activeOrganizationId);

  // Gallery state is kept outside react-hook-form (File objects aren't serialisable)
  const [mediaItems, setMediaItems] = useState<LocalMediaItem[]>(initialMedia);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
    defaultValues:
      initialData ||
      ({
        type: 'REAL_ESTATE_ASSET',
        title: '',
        description: '',
        base_price: 0,
        currency: 'USD',
        available_addons: [],
        extra_specifications: [],
        specifications: {
          bedrooms: 0,
          bathrooms: 0,
          square_meters: 10,
          year_built: 2000,
        },
      } as ProductFormValues),
  });

  const selectedType = useWatch({ control: form.control, name: 'type' });
  const prevTypeRef = useRef(form.getValues('type'));

  // When type changes, reset only type-specific fields, preserving shared ones
  // But only if the type actually changed by user, not during initial render
  useEffect(() => {
    if (selectedType !== prevTypeRef.current) {
      const preserved = {
        title: form.getValues('title'),
        description: form.getValues('description'),
        base_price: form.getValues('base_price'),
        currency: form.getValues('currency'),
        available_addons: form.getValues('available_addons'),
        extra_specifications: [], // Clear extra specs on type change normally
      };
      form.reset({
        ...preserved,
        ...TYPE_DEFAULTS[selectedType],
      } as ProductFormValues);
      prevTypeRef.current = selectedType;
    }
  }, [selectedType, form]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (!activeOrganizationId) {
        toast.error('Please select an organization before managing products.');
        return;
      }

      // ── STEP 1: Create product with JSON data (excluding media) ──────────
      const payload = buildPayload(data);

      let createdProduct;

      if (isEditMode) {
        if (!productId) {
          toast.error('Missing product ID for update.');
          return;
        }

        // Update mode: patch the product
        createdProduct = await productService.update(
          activeOrganizationId,
          productId,
          payload as Partial<CreateProductDto>
        );
      } else {
        // Create mode: post the product
        createdProduct = await productService.create(
          activeOrganizationId,
          payload
        );
      }

      // Extract the product ID for media upload
      const currentProductId = createdProduct.id;

      // ── STEP 2: Upload files conditionally ──────────────────────────────
      let mediaUploadError = false;

      const filesToUpload = mediaItems
        .map((item) => item.file)
        .filter((file): file is File => file instanceof File);

      if (filesToUpload.length > 0) {
        try {
          const formData = new FormData();
          filesToUpload.forEach((file) => {
            formData.append('files', file);
          });

          const productMedia = await productService.uploadMedia(
            activeOrganizationId,
            currentProductId,
            formData
          );
          productMedia.data.forEach((media) => {
            // Optimistically set the first uploaded image as primary
            const matchingItem = mediaItems.find(
              (item) => item.file?.name === media.file_name
            );
            if (matchingItem && matchingItem.isPrimary) {
              try {
                setProductPrimaryMedia(
                  activeOrganizationId,
                  currentProductId,
                  media.id
                );
              } catch (error) {
                mediaUploadError = true;
                const uploadErrorMsg =
                  getErrorMessage(error) || 'Unknown upload error';
                console.error('Failed to set primary media:', uploadErrorMsg);
              }
            }
          });
          // await setProductPrimaryMedia(activeOrganizationId, currentProductId, mediaId);
        } catch (uploadErr: unknown) {
          // Edge case: Product created successfully but file upload failed
          mediaUploadError = true;
          const uploadErrorMsg =
            getErrorMessage(uploadErr) || 'Unknown upload error';
          console.error('Media upload failed:', uploadErrorMsg);
        }
      }

      // ── Success & Redirect ─────────────────────────────────────────────
      if (mediaUploadError) {
        // Product was created, but images failed — warn user but don't block
        toast.warning(
          'Product created, but images failed to upload. Please edit the product to try again.'
        );
      } else {
        toast.success(
          isEditMode
            ? 'Product updated successfully!'
            : 'Product created successfully!'
        );
      }

      // Invalidate products list and specific query
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all(activeOrganizationId),
      });
      if (isEditMode) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(
            activeOrganizationId,
            productId as string
          ),
        });
      }

      // Always redirect to catalog on success
      router.push('../products');
    } catch (err: unknown) {
      const fallback = `Failed to ${isEditMode ? 'update' : 'create'} product.`;
      toast.error(getErrorMessage(err) || fallback);
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <FormProvider {...form}>
      {/* Page header */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight">
          {isEditMode ? 'Edit Product' : 'Create New Product'}
        </h2>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {isEditMode
            ? 'Update your product details and configuration.'
            : 'Design and configure your dynamic product offerings for any industry.'}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1 – Basics + Gallery */}
        <ProductBasicsSection
          mediaItems={mediaItems}
          onMediaChange={setMediaItems}
          productId={productId}
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
        <div className="border-border mt-4 flex items-center justify-between border-t pt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground text-xs font-bold tracking-widest uppercase transition-colors"
          >
            Discard Draft
          </button>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="border-border text-foreground hover:bg-muted rounded-xl border px-8 py-3 text-xs font-bold tracking-widest uppercase transition-all"
            >
              Save as Template
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground flex items-center gap-2 rounded-xl px-10 py-3 text-xs font-bold tracking-widest uppercase shadow-[0_10px_24px_-10px_hsl(var(--primary)/0.4)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {isEditMode ? 'Saving…' : 'Publishing…'}
                </>
              ) : isEditMode ? (
                'Save Changes'
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
