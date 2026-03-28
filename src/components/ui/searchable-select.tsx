'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from 'react-hook-form';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder: string;
  options: Array<SearchableSelectOption>;
  searchPlaceholder: string;
  emptyLabel: string;
  disabled?: boolean;
  allowNone?: boolean;
  noneLabel?: string;
};

const NONE_VALUE = '__none__';

export function SearchableSelect<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
  searchPlaceholder,
  emptyLabel,
  disabled = false,
  allowNone = false,
  noneLabel,
}: SearchableSelectProps<TFieldValues>) {
  const { field, fieldState } = useController({
    control,
    name,
  });
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized)
    );
  }, [options, search]);

  const currentValue = typeof field.value === 'string' ? field.value : '';
  const resolvedValue = allowNone
    ? currentValue || NONE_VALUE
    : currentValue || undefined;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Select
        value={resolvedValue}
        onValueChange={(nextValue) => {
          if (allowNone && nextValue === NONE_VALUE) {
            field.onChange('');
            return;
          }

          field.onChange(nextValue);
        }}
        onOpenChange={(nextOpen) => {
          setIsOpen(nextOpen);
          if (!nextOpen) {
            setSearch('');
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 pb-2">
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder={searchPlaceholder}
            />
          </div>

          {allowNone ? (
            <SelectItem value={NONE_VALUE}>
              {noneLabel ?? emptyLabel}
            </SelectItem>
          ) : null}

          {filteredOptions.length === 0 ? (
            <div className="text-muted-foreground px-2 py-2 text-sm">
              {emptyLabel}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {fieldState.error?.message ? (
        <p className="text-destructive text-xs">{fieldState.error.message}</p>
      ) : null}
    </div>
  );
}
