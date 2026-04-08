import { Briefcase, Copy } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { SharedSelectField } from '@/components/ui/form-controls/SharedSelectField';
import { SharedTextField } from '@/components/ui/form-controls/SharedTextField';
import { industryOptions } from '../_constants';
import type { OrganizationFormControl } from '../_schema';
import { SectionCard } from './SectionCard';
import { useOrganizationSettings } from '../_hooks/useOrganizationSettings';

type Props = { control: OrganizationFormControl };

function AddressField({ control }: Props) {
  return (
    <FormField
      control={control}
      name="address"
      render={({ field }) => (
        <FormItem className="md:col-span-2">
          <FormLabel>Multi-line Address</FormLabel>
          <FormControl>
            <textarea
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
              rows={3}
              placeholder={`101 Monolith Way, Suite 400\nSan Francisco, CA 94105\nUnited States`}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function LegalBusinessSection({ control }: Props) {
  const t = useTranslations('Settings.OrganizationSettings');
  const { form } = useOrganizationSettings();

  const handleCopySlug = useCallback(() => {
    const slug = form.getValues('slug');
    navigator.clipboard.writeText(slug);
    toast.success(t('slugCopiedSuccess'));
  }, [form, t]);

  return (
    <SectionCard
      title="Legal & Business"
      icon={Briefcase}
      className="lg:col-span-8"
    >
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
        <div className="flex-1">
          <SharedTextField
            control={control}
            name="slug"
            label={t('workspaceSlugLabel')}
            placeholder="Kinetic Monolith Systems Corp."
            disabled
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCopySlug}
          className="border-zinc-700 hover:bg-zinc-800"
          title={t('workspaceSlugTooltip')}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SharedTextField
          control={control}
          name="name"
          label="Legal Name"
          placeholder="Kinetic Monolith Systems Corp."
        />
        <SharedSelectField
          control={control}
          name="industry_category"
          label="Industry Category"
          options={industryOptions}
          placeholder="Select category"
        />
        <SharedTextField
          control={control}
          name="tax_number"
          label="Tax Number (VAT/EIN)"
          placeholder="XX-XXXXXXX"
        />
        <SharedTextField
          control={control}
          name="tax_office"
          label="Tax Office"
          placeholder="San Francisco Central"
        />
        <AddressField control={control} />
      </div>
    </SectionCard>
  );
}
