'use client';

import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { SharedSelectField } from '@/components/ui/form-controls/SharedSelectField';
import { SharedTextField } from '@/components/ui/form-controls/SharedTextField';
import { PhoneInputGroup } from '@/components/ui/phone-input-group';
import { COUNTRY_CALLING_CODES } from '@/constants/regions';

import { type AddLeadFormValues, genderOptions } from './form.config';

type LeadIdentitySectionProps = {
  disabled?: boolean;
};

export function LeadIdentitySection({
  disabled = false,
}: LeadIdentitySectionProps) {
  const t = useTranslations('Leads');
  const { control } = useFormContext<AddLeadFormValues>();

  const genderSelectOptions = useMemo(
    () =>
      genderOptions.map((gender) => ({
        value: gender,
        label: t(`gender.${gender}` as never),
      })),
    [t]
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <SharedTextField
          control={control}
          name="first_name"
          label={t('form.fields.first_name.label')}
          placeholder={t('form.fields.first_name.placeholder')}
          disabled={disabled}
        />

        <SharedTextField
          control={control}
          name="last_name"
          label={t('form.fields.last_name.label')}
          placeholder={t('form.fields.last_name.placeholder')}
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SharedTextField
          control={control}
          name="native_name"
          label={t('form.fields.native_name.label')}
          placeholder={t('form.fields.native_name.placeholder')}
          disabled={disabled}
        />

        <SharedTextField
          control={control}
          name="email"
          label={t('form.fields.email.label')}
          placeholder={t('form.fields.email.placeholder')}
          type="email"
          disabled={disabled}
        />
      </div>

      <PhoneInputGroup
        control={control}
        phoneCodeName="phone_country_code"
        phoneNumberName="phone_number"
        label={t('form.fields.phone_number.label')}
        codePlaceholder={t('form.fields.phone_country_code.placeholder')}
        numberPlaceholder={t('form.fields.phone_number.placeholder')}
        options={COUNTRY_CALLING_CODES}
        disabled={disabled}
      />

      <SharedSelectField
        control={control}
        name="gender"
        label={t('form.fields.gender.label')}
        options={genderSelectOptions}
        disabled={disabled}
      />
    </>
  );
}
