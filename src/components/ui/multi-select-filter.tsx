'use client';

import { useMemo, useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type MultiSelectFilterOption = {
  value: string;
  label: string;
};

type MultiSelectFilterProps = {
  options: MultiSelectFilterOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  selectedCountLabel: (count: number) => string;
  className?: string;
  disabled?: boolean;
};

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function MultiSelectFilter({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  selectedCountLabel,
  className,
  disabled,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const normalizedValue = useMemo(
    () => uniqueStrings(value.filter((entry) => entry.trim().length > 0)),
    [value]
  );

  const selectedLabels = useMemo(() => {
    const labelMap = new Map(
      options.map((option) => [option.value, option.label])
    );

    return normalizedValue.map((entry) => labelMap.get(entry) ?? entry);
  }, [normalizedValue, options]);

  const summaryLabel =
    normalizedValue.length === 0
      ? placeholder
      : normalizedValue.length <= 2
        ? selectedLabels.join(', ')
        : selectedCountLabel(normalizedValue.length);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('h-9 w-56 justify-between', className)}
        >
          <span className="truncate text-left font-normal">{summaryLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isChecked = normalizedValue.includes(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => {
                      const nextValues = isChecked
                        ? normalizedValue.filter(
                            (entry) => entry !== option.value
                          )
                        : [...normalizedValue, option.value];

                      onChange(nextValues);
                    }}
                  >
                    <Checkbox
                      checked={isChecked}
                      className="pointer-events-none"
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>

      {normalizedValue.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1">
          {selectedLabels.slice(0, 2).map((label) => (
            <Badge key={label} variant="secondary" className="text-[10px]">
              {label}
            </Badge>
          ))}
          {normalizedValue.length > 2 ? (
            <Badge variant="outline" className="text-[10px]">
              {selectedCountLabel(normalizedValue.length)}
            </Badge>
          ) : null}
        </div>
      ) : null}
    </Popover>
  );
}
