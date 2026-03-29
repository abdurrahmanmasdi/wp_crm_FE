'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SharedSelectOption = {
  label: string;
  value: string;
};

/**
 * Props for `SharedSelectField`.
 *
 * `options` should be a stable `{ label, value }` list generated from constants,
 * enums, or API data to keep form sections declarative and compact.
 */
export interface SharedSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  options: Array<SharedSelectOption>;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * SharedSelectField
 *
 * Reusable select molecule for React Hook Form + shadcn select primitives.
 * It standardizes select wiring, labels, and error output with the same
 * field structure used across the application.
 */
export function SharedSelectField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  options,
  placeholder,
  disabled,
}: SharedSelectFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = typeof field.value === 'string' ? field.value : '';

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select
              value={value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
