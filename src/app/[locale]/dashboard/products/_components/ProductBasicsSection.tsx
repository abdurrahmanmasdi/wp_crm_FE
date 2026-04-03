'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
}

export function ProductBasicsSection({
  mediaItems,
  onMediaChange,
}: ProductBasicsSectionProps) {
  const { control } = useFormContext<ProductFormValues>();
  const currency = useWatch({ control, name: 'currency' }) as string;
  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? currency;

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
          <FormField
            control={control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Product Type</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="border-border bg-muted/40 focus:ring-primary/40 rounded-xl px-4 py-3 text-sm focus:ring-1">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(
                      Object.keys(PRODUCT_TYPE_LABELS) as Array<
                        keyof typeof PRODUCT_TYPE_LABELS
                      >
                    ).map((key) => (
                      <SelectItem key={key} value={key}>
                        {PRODUCT_TYPE_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Title */}
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Product Title</FieldLabel>
                <FormControl>
                  <Input
                    className="border-border bg-muted/40 placeholder:text-muted-foreground/40 focus-visible:ring-primary/40 rounded-xl px-4 py-3 text-sm focus-visible:ring-1"
                    placeholder="e.g. Midnight Fjords Kayak Expedition"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Description</FieldLabel>
                <FormControl>
                  <Textarea
                    className="border-border bg-muted/40 placeholder:text-muted-foreground/40 focus-visible:ring-primary/40 resize-none rounded-xl p-4 text-sm focus-visible:ring-1"
                    rows={4}
                    placeholder="Describe the experience, highlights, and key features..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
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

            <FormField
              control={control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>Currency</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-border bg-muted/40 focus:ring-primary/40 rounded-xl px-4 py-3 text-sm focus:ring-1">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c} ({CURRENCY_SYMBOLS[c]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Right column – Product Gallery */}
        <div>
          <FieldLabel>Product Gallery</FieldLabel>
          <ProductGallery items={mediaItems} onChange={onMediaChange} />
        </div>
      </div>
    </section>
  );
}
