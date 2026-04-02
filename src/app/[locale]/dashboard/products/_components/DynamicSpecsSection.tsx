'use client';

import { useFormContext, useWatch, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductFormValues } from '../_schema';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
      {children}
    </p>
  );
}

function SpecInput({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

const inputCls =
  'rounded-xl border-border bg-muted/40 px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/40';
const selectCls =
  'rounded-xl border-border bg-muted/40 px-4 py-3 text-sm focus:ring-1 focus:ring-primary/40';
const dateInputCls =
  'rounded-xl border-border bg-muted/40 px-4 py-3 text-sm focus-visible:ring-1 focus-visible:ring-primary/40 [color-scheme:dark]';

/** Freeform key-value attribute builder — always shown below core specs */
function ExtraSpecsBuilder({ control }: { control: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'extra_specifications',
  });

  return (
    <div className="mt-8 border-t border-border/50 pt-7">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Extra Attributes
          </p>
        </div>
        <button
          type="button"
          onClick={() => append({ key: '', value: '' })}
          className="group flex items-center gap-1.5 rounded-lg border border-border/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
        >
          <Plus className="h-3 w-3 transition-transform duration-200 group-hover:rotate-90" />
          Add Attribute
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground/50">
          Add custom key–value attributes specific to this product.
        </p>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-3">
                  <FormField
                    control={control}
                    name={`extra_specifications.${index}.key`}
                    render={({ field: f }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input {...f} placeholder="e.g. Material" className={inputCls} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`extra_specifications.${index}.value`}
                    render={({ field: f }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input {...f} placeholder="e.g. Carbon Fiber" className={inputCls} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="mt-0.5 rounded-lg p-2.5 text-muted-foreground/30 transition-all hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export function DynamicSpecsSection() {
  const { control } = useFormContext<ProductFormValues>();
  const selectedType = useWatch({ control, name: 'type' });

  const renderFields = () => {
    switch (selectedType) {
      case 'REAL_ESTATE_ASSET':
        return (
          <div className="grid grid-cols-2 gap-6">
            <FormField control={control} name="specifications.bedrooms" render={({ field }) => (
              <FormItem><SpecInput label="Bedrooms"><FormControl><Input type="number" min={0} className={inputCls} {...field} /></FormControl></SpecInput><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="specifications.bathrooms" render={({ field }) => (
              <FormItem><SpecInput label="Bathrooms"><FormControl><Input type="number" step="0.5" min={0} className={inputCls} {...field} /></FormControl></SpecInput><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="specifications.square_meters" render={({ field }) => (
              <FormItem><SpecInput label="Square Meters"><FormControl><Input type="number" min={1} className={inputCls} {...field} /></FormControl></SpecInput><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="specifications.year_built" render={({ field }) => (
              <FormItem><SpecInput label="Year Built"><FormControl><Input type="number" min={1800} className={inputCls} {...field} /></FormControl></SpecInput><FormMessage /></FormItem>
            )} />
          </div>
        );

      case 'SCHEDULED_EVENT':
        return (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Dates + capacity — mapped to instances[0] on submit */}
            <FormField control={control} name="instance.start_date" render={({ field }) => (
              <FormItem>
                <SpecInput label="Start Date & Time">
                  <FormControl><Input type="datetime-local" className={dateInputCls} {...field} /></FormControl>
                </SpecInput>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={control} name="instance.end_date" render={({ field }) => (
              <FormItem>
                <SpecInput label="End Date & Time">
                  <FormControl><Input type="datetime-local" className={dateInputCls} {...field} /></FormControl>
                </SpecInput>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={control} name="instance.max_capacity" render={({ field }) => (
              <FormItem><SpecInput label="Max Capacity"><FormControl><Input type="number" min={1} className={inputCls} {...field} /></FormControl></SpecInput><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="specifications.duration_hours" render={({ field }) => (
              <FormItem><SpecInput label="Duration (hours)"><FormControl><Input type="number" step="0.5" min={0.5} className={inputCls} {...field} /></FormControl></SpecInput><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="specifications.difficulty_level" render={({ field }) => (
              <FormItem>
                <SpecInput label="Difficulty">
                  <Select onValueChange={field.onChange} value={field.value as string}>
                    <FormControl><SelectTrigger className={selectCls}><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </SpecInput>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={control} name="specifications.meeting_point" render={({ field }) => (
              <FormItem className="md:col-span-2"><SpecInput label="Meeting Point"><FormControl><Input className={inputCls} placeholder="e.g. Main Entrance Plaza" {...field} /></FormControl></SpecInput><FormMessage /></FormItem>
            )} />
          </div>
        );

      case 'RESOURCE_RENTAL':
        return (
          <div className="grid grid-cols-2 gap-6">
            <FormField control={control} name="specifications.transmission" render={({ field }) => (
              <FormItem>
                <SpecInput label="Transmission">
                  <Select onValueChange={field.onChange} value={field.value as string}>
                    <FormControl><SelectTrigger className={selectCls}><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </SpecInput>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={control} name="specifications.fuel_type" render={({ field }) => (
              <FormItem><SpecInput label="Fuel Type"><FormControl><Input className={inputCls} placeholder="Electric, Gasoline…" {...field} /></FormControl></SpecInput><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="specifications.seats" render={({ field }) => (
              <FormItem><SpecInput label="Seats"><FormControl><Input type="number" min={1} className={inputCls} {...field} /></FormControl></SpecInput><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="specifications.daily_limit_km" render={({ field }) => (
              <FormItem><SpecInput label="Daily Limit km (opt.)"><FormControl><Input type="number" min={0} className={inputCls} {...field} value={field.value ?? ''} /></FormControl></SpecInput><FormMessage /></FormItem>
            )} />
          </div>
        );

      case 'DYNAMIC_SERVICE':
        return (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField control={control} name="specifications.base_fee" render={({ field }) => (
              <FormItem><SpecInput label="Base Fee"><FormControl><Input type="number" step="0.01" className={inputCls} {...field} /></FormControl></SpecInput><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="specifications.hourly_rate" render={({ field }) => (
              <FormItem><SpecInput label="Hourly Rate (opt.)"><FormControl><Input type="number" step="0.01" className={inputCls} {...field} value={field.value ?? ''} /></FormControl></SpecInput><FormMessage /></FormItem>
            )} />
            <FormField control={control} name="specifications.price_per_km" render={({ field }) => (
              <FormItem><SpecInput label="Price / KM (opt.)"><FormControl><Input type="number" step="0.01" className={inputCls} {...field} value={field.value ?? ''} /></FormControl></SpecInput><FormMessage /></FormItem>
            )} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="rounded-[20px] border border-border bg-card p-8 shadow-sm">
      <div className="mb-8 flex items-center gap-3">
        <span className="h-6 w-1.5 rounded-full bg-primary" />
        <h3 className="text-lg font-bold tracking-tight">Specifications</h3>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Adapts to product type
        </span>
      </div>

      {renderFields()}
      <ExtraSpecsBuilder control={control} />
    </section>
  );
}
