import { Globe } from 'lucide-react';
import { SharedSelectField } from '@/components/ui/form-controls/SharedSelectField';
import { SharedTextField } from '@/components/ui/form-controls/SharedTextField';
import { type LeadCurrency } from '@/types/leads';
import type { OrganizationFormControl } from '../_schema';
import { SectionCard } from './SectionCard';

const apiCurrencies: LeadCurrency[] = ['USD', 'TRY', 'EUR', 'GBP'];
const dynamicCurrencyOptions = apiCurrencies.map((c) => ({
  label: c,
  value: c,
}));

type Props = { control: OrganizationFormControl };

export function ContactLocalizationSection({ control }: Props) {
  return (
    <SectionCard
      title="Contact & Localization"
      icon={Globe}
      className="lg:col-span-6"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SharedSelectField
            control={control}
            name="default_currency"
            label="Currency"
            options={dynamicCurrencyOptions}
          />
          <SharedTextField
            control={control}
            name="website_url"
            label="Website URL"
            placeholder="https://kinetic.io"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SharedTextField
            control={control}
            name="public_email"
            label="Public Email"
            type="email"
            placeholder="ops@kinetic.io"
          />
          <SharedTextField
            control={control}
            name="public_phone"
            label="Public Phone"
            type="tel"
            placeholder="+1 (555) 000-1234"
          />
        </div>
      </div>
    </SectionCard>
  );
}
