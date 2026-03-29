'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
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

export type SharedSearchableSelectOption = {
  label: string;
  value: string;
};

/**
 * Props for `SharedSearchableSelectField`.
 *
 * This molecule provides a searchable select experience backed by RHF control,
 * built with shadcn `Popover` + `Command` primitives for fast option filtering.
 */
export interface SharedSearchableSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  options: Array<SharedSearchableSelectOption>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  description?: string;
  disabled?: boolean;
  allowNone?: boolean;
  noneLabel?: string;
}

/**
 * SharedSearchableSelectField
 *
 * Reusable RHF form molecule that wraps field label/control/error plumbing and
 * exposes a searchable option picker with consistent styling.
 */
export function SharedSearchableSelectField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  options,
  placeholder,
  searchPlaceholder = 'Search...',
  emptyLabel = 'No results found.',
  description,
  disabled,
  allowNone = false,
  noneLabel,
}: SharedSearchableSelectFieldProps<TFieldValues, TName>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const currentValue =
          typeof field.value === 'string'
            ? field.value
            : String(field.value ?? '');
        const selectedOption = options.find(
          (option) => option.value === currentValue
        );

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn(
                      'w-full justify-between',
                      !selectedOption && 'text-muted-foreground'
                    )}
                    disabled={disabled}
                  >
                    {selectedOption
                      ? selectedOption.label
                      : currentValue === '' && allowNone
                        ? (noneLabel ?? emptyLabel)
                        : (placeholder ?? '')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>

              <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder={searchPlaceholder} />
                  <CommandList>
                    <CommandEmpty>{emptyLabel}</CommandEmpty>
                    <CommandGroup>
                      {allowNone ? (
                        <CommandItem
                          value={noneLabel ?? emptyLabel}
                          onSelect={() => {
                            field.onChange('');
                            setIsOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              currentValue === '' ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {noneLabel ?? emptyLabel}
                        </CommandItem>
                      ) : null}

                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={() => {
                            field.onChange(option.value);
                            setIsOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              option.value === currentValue
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
