'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

/**
 * Props for `SharedTextField`.
 *
 * This molecule standardizes text-like controls (`text`, `email`, `number`, `date`, etc.)
 * with a single, consistent FormField layout and validation message rendering.
 */
export interface SharedTextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'number' | 'date' | 'password' | 'search' | 'tel';
  description?: string;
  disabled?: boolean;
  parseAsNumber?: boolean;
  step?: number | string;
}

/**
 * SharedTextField
 *
 * Reusable text-input molecule for React Hook Form + shadcn-style form composition.
 * It wraps `FormField`, `FormItem`, `FormLabel`, `FormControl`, `Input`, and `FormMessage`
 * so feature forms can stay concise while preserving consistent UX and validation output.
 */
export function SharedTextField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  placeholder,
  type = 'text',
  description,
  disabled,
  parseAsNumber = false,
  step,
}: SharedTextFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const resolvedValue =
          parseAsNumber && typeof field.value === 'number'
            ? Number.isNaN(field.value)
              ? ''
              : field.value
            : (field.value ?? '');

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                step={step}
                value={resolvedValue}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={(event) => {
                  if (parseAsNumber) {
                    const raw = event.target.value;
                    field.onChange(raw === '' ? Number.NaN : Number(raw));
                    return;
                  }

                  field.onChange(event);
                }}
              />
            </FormControl>
            {description ? (
              <FormDescription>{description}</FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
