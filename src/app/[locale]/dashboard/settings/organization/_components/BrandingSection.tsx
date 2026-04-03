import { Palette, Plus, Trash2 } from 'lucide-react';
import { useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { OrganizationFormControl } from '../_schema';
import { SectionCard } from './SectionCard';

type Props = { control: OrganizationFormControl };

export function BrandingSection({ control }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'brand_colors',
  });

  return (
    <SectionCard title="Branding" icon={Palette}>
      <div className="flex flex-col gap-8">
        {/* Logo preview + URL input */}
        <FormField
          control={control}
          name="logo_url"
          render={({ field }) => (
            <div className="flex items-center gap-6">
              {/* Live preview */}
              <div className="bg-surface border-outline-variant/30 flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded border">
                {field.value ? (
                  <img
                    className="h-full w-full object-cover"
                    alt="Organization logo"
                    src={field.value}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        'none';
                    }}
                  />
                ) : (
                  <Palette className="text-on-surface-variant h-8 w-8 opacity-30" />
                )}
              </div>
              <div className="flex-1">
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://cdn.monolith.io/logo.svg"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
            </div>
          )}
        />

        {/* Brand colours */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <FormLabel className="text-sm font-semibold">
              Brand Colors
            </FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => append({ key: '', value: '#000000' })}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Color
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <FormField
                    control={control}
                    name={`brand_colors.${index}.key`}
                    render={({ field: keyField }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Color name (e.g. primary)"
                            {...keyField}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-1 gap-2">
                  <FormField
                    control={control}
                    name={`brand_colors.${index}.value`}
                    render={({ field: valField }) => (
                      <FormItem className="flex flex-1 gap-2 space-y-0">
                        <FormControl>
                          <div className="flex flex-1 items-center gap-2">
                            {/* Native color picker box */}
                            <input
                              type="color"
                              className="h-10 w-10 shrink-0 cursor-pointer rounded border border-white/10 bg-transparent object-cover p-0"
                              value={valField.value || '#000000'}
                              onChange={(e) =>
                                valField.onChange(e.target.value)
                              }
                            />
                            {/* Hex input */}
                            <Input placeholder="#000000" {...valField} />
                          </div>
                        </FormControl>
                        <FormMessage className="absolute" />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-error/60 hover:text-error h-10 w-10 shrink-0"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-on-surface-variant text-xs italic">
                No brand colors defined.
              </p>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
