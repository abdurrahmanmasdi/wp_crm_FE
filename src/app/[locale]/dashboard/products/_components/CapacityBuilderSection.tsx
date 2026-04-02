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
    <section className="rounded-[20px] border border-primary/20 bg-primary/5 p-8 shadow-sm">
      <div className="mb-8 flex items-center gap-3">
        <span className="h-6 w-1.5 rounded-full bg-primary" />
        <h3 className="text-lg font-bold tracking-tight text-primary">Capacity Builder</h3>
        <span className="ml-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
          Scheduled Events only
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name={'max_capacity' as any}
          render={({ field }) => (
            <FormItem>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Max Capacity per Event
              </p>
              <FormControl>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input
                    type="number"
                    min={1}
                    className="rounded-xl border-primary/20 bg-muted/40 pl-11 pr-4 py-3 text-sm focus-visible:ring-1 focus-visible:ring-primary/40"
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
          <p className="text-xs text-muted-foreground leading-relaxed">
            This limit determines how many bookings can be created per event instance. Each booking
            consumes one slot until the capacity is reached.
          </p>
        </div>
      </div>
    </section>
  );
}
