'use client';

import { useFormContext } from 'react-hook-form';
import { Users } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ProductFormValues } from '../_schema';

export function CapacityBuilderSection() {
  const { control } = useFormContext<ProductFormValues>();

  return (
    <section className="border-primary/20 bg-primary/5 rounded-[20px] border p-8 shadow-sm">
      <div className="mb-8 flex items-center gap-3">
        <span className="bg-primary h-6 w-1.5 rounded-full" />
        <h3 className="text-primary text-lg font-bold tracking-tight">
          Capacity Builder
        </h3>
        <span className="border-primary/30 bg-primary/10 text-primary ml-2 rounded-full border px-3 py-0.5 text-[9px] font-bold tracking-widest uppercase">
          Scheduled Events only
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name="instance.max_capacity"
          render={({ field }) => (
            <FormItem>
              <p className="text-muted-foreground mb-2 text-[10px] font-bold tracking-widest uppercase">
                Max Capacity per Event
              </p>
              <FormControl>
                <div className="relative">
                  <Users className="text-primary/60 absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
                  <Input
                    type="number"
                    min={1}
                    className="border-primary/20 bg-muted/40 focus-visible:ring-primary/40 rounded-xl py-3 pr-4 pl-11 text-sm focus-visible:ring-1"
                    {...field}
                    value={field.value as number}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-end pb-1">
          <p className="text-muted-foreground text-xs leading-relaxed">
            This limit determines how many bookings can be created per event
            instance. Each booking consumes one slot until the capacity is
            reached.
          </p>
        </div>
      </div>
    </section>
  );
}
