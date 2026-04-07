'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SharedTextField } from '@/components/ui/form-controls/SharedTextField';
import { SharedTextarea } from '@/components/ui/form-controls/SharedTextarea';
import { SharedSelect } from '@/components/ui/form-controls/SharedSelect';
import {
  CURRENCY_SYMBOLS,
  PRODUCT_TYPE_LABELS,
  type LocalMediaItem,
  type ProductFormValues,
} from '../_schema';
import { ProductGallery } from './ProductGallery';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY'];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground mb-2 text-[10px] font-bold tracking-widest uppercase">
      {children}
    </p>
  );
}

interface ProductBasicsSectionProps {
  mediaItems: LocalMediaItem[];
  onMediaChange: (items: LocalMediaItem[]) => void;
  productId?: string;
}

export function ProductBasicsSection({
  mediaItems,
  onMediaChange,
  productId,
}: ProductBasicsSectionProps) {
  const { control } = useFormContext<ProductFormValues>();
  const currency = useWatch({ control, name: 'currency' }) as string;
  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? currency;

  const productTypeOptions = (
    Object.keys(PRODUCT_TYPE_LABELS) as Array<keyof typeof PRODUCT_TYPE_LABELS>
  ).map((key) => ({
    value: key,
    label: PRODUCT_TYPE_LABELS[key],
  }));

  const currencyOptions = CURRENCIES.map((c) => ({
    value: c,
    label: `${c} (${CURRENCY_SYMBOLS[c]})`,
  }));

  return (
    <section className="border-border bg-card rounded-[20px] border p-8 shadow-sm">
      {/* Section header */}
      <div className="mb-8 flex items-center gap-3">
        <span className="bg-primary h-6 w-1.5 rounded-full" />
        <h3 className="text-lg font-bold tracking-tight">The Basics</h3>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Left column – form fields */}
        <div className="space-y-6">
          {/* Product Type */}
          <SharedSelect
            control={control}
            name="type"
            label="Product Type"
            options={productTypeOptions}
          />

          {/* Title */}
          <SharedTextField
            control={control}
            name="title"
            label="Product Title"
            placeholder="e.g. Midnight Fjords Kayak Expedition"
          />

          {/* Description */}
          <SharedTextarea
            control={control}
            name="description"
            label="Description"
            placeholder="Describe the experience, highlights, and key features..."
            rows={4}
          />

          {/* Price + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="base_price"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>Base Price</FieldLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="text-primary absolute top-1/2 left-4 -translate-y-1/2 text-sm font-medium">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        className="border-border bg-muted/40 placeholder:text-muted-foreground/40 focus-visible:ring-primary/40 rounded-xl py-3 pr-4 pl-8 text-sm focus-visible:ring-1"
                        placeholder="0.00"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SharedSelect
              control={control}
              name="currency"
              label="Currency"
              options={currencyOptions}
            />
          </div>
        </div>

        {/* Right column – Product Gallery */}
        <div>
          <FieldLabel>Product Gallery</FieldLabel>
          <ProductGallery
            items={mediaItems}
            onChange={onMediaChange}
            productId={productId}
          />
        </div>
      </div>
    </section>
  );
}
