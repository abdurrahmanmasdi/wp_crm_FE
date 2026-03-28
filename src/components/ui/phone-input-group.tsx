'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';

type PhoneCodeOption = SearchableSelectOption & {
  regionCode?: string;
};

function createRegionDisplayNames(locale: string): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' });
  } catch {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' });
    } catch {
      return null;
    }
  }
}

type PhoneInputGroupProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  phoneCodeName: Path<TFieldValues>;
  phoneNumberName: Path<TFieldValues>;
  label: string;
  codePlaceholder: string;
  numberPlaceholder: string;
  options: Array<PhoneCodeOption>;
  disabled?: boolean;
};

export function PhoneInputGroup<TFieldValues extends FieldValues>({
  control,
  phoneCodeName,
  phoneNumberName,
  label,
  codePlaceholder,
  numberPlaceholder,
  options,
  disabled = false,
}: PhoneInputGroupProps<TFieldValues>) {
  const locale = useLocale();
  const regionDisplayNames = useMemo(
    () => createRegionDisplayNames(locale),
    [locale]
  );

  const localizedOptions = useMemo(
    () =>
      options.map((option) => {
        if (!option.regionCode) {
          return option;
        }

        const localizedRegionName =
          regionDisplayNames?.of(option.regionCode) ?? option.label;

        return {
          ...option,
          label: `${localizedRegionName} (${option.value})`,
        };
      }),
    [options, regionDisplayNames]
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        <Controller
          control={control}
          name={phoneCodeName}
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <Select
                value={typeof field.value === 'string' ? field.value : ''}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={codePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {localizedOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {fieldState.error?.message ? (
                <p className="text-destructive text-xs">
                  {fieldState.error.message}
                </p>
              ) : null}
            </div>
          )}
        />

        <Controller
          control={control}
          name={phoneNumberName}
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <Input
                value={typeof field.value === 'string' ? field.value : ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                placeholder={numberPlaceholder}
                disabled={disabled}
              />

              {fieldState.error?.message ? (
                <p className="text-destructive text-xs">
                  {fieldState.error.message}
                </p>
              ) : null}
            </div>
          )}
        />
      </div>
    </div>
  );
}
