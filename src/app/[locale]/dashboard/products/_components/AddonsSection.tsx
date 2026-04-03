'use client';

import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Plus, Trash2, Puzzle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { CURRENCY_SYMBOLS, type ProductFormValues } from '../_schema';

export function AddonsSection() {
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'available_addons',
  });

  // Reactively read the selected currency so the symbol updates live
  const currency = useWatch({ control, name: 'currency' }) as string;
  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? currency;

  return (
    <section className="border-border bg-card rounded-[20px] border p-8 shadow-sm">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-primary h-6 w-1.5 rounded-full" />
          <h3 className="text-lg font-bold tracking-tight">
            Available Add-ons
          </h3>
        </div>
        <button
          type="button"
          onClick={() => append({ name: '', price: 0 })}
          className="group border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-bold transition-all"
        >
          <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
          Add Extra Service
        </button>
      </div>

      {/* Empty state */}
      {fields.length === 0 ? (
        <div className="border-border flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-14 text-center">
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
            <Puzzle className="text-primary h-5 w-5 opacity-60" />
          </div>
          <div>
            <p className="text-sm font-semibold">No add-ons yet</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Click &ldquo;Add Extra Service&rdquo; to create optional upsells.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="group border-border bg-muted/20 hover:border-primary/30 hover:bg-muted/30 flex items-center gap-6 rounded-2xl border p-5 transition-all">
                  {/* Icon box */}
                  <div className="border-border bg-card group-hover:shadow-primary/5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-inner transition-all">
                    <Puzzle className="text-primary h-6 w-6" />
                  </div>

                  {/* Name */}
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground/70 mb-1 text-[9px] font-bold tracking-[0.15em] uppercase">
                      Service Name
                    </p>
                    <FormField
                      control={control}
                      name={`available_addons.${index}.name`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormControl>
                            <input
                              {...f}
                              type="text"
                              className="text-foreground placeholder:text-muted-foreground/40 w-full border-none bg-transparent p-0 text-base font-semibold focus:ring-0 focus:outline-none"
                              placeholder="e.g. Gourmet Lunch Packet"
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Price — wider + dynamic currency symbol */}
                  <div className="border-border/50 flex shrink-0 flex-col items-end gap-1 border-l pr-2 pl-6">
                    <p className="text-muted-foreground/70 text-[9px] font-bold tracking-[0.15em] uppercase">
                      {currency} Pricing
                    </p>
                    <FormField
                      control={control}
                      name={`available_addons.${index}.price`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <span className="text-primary text-base font-bold">
                                {currencySymbol}
                              </span>
                              <input
                                {...f}
                                type="number"
                                step="0.01"
                                min={0}
                                className="text-foreground placeholder:text-muted-foreground/40 w-32 border-none bg-transparent p-0 text-right text-xl font-bold focus:ring-0 focus:outline-none"
                                placeholder="0.00"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-muted-foreground/30 rounded-lg p-2 transition-all hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
