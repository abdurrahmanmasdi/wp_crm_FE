'use client';

import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';

import { SharedSelect } from '@/components/ui/form-controls/SharedSelect';
import { SharedSearchableSelectField } from '@/components/ui/form-controls/SharedSearchableSelectField';
import {
  COMMON_ISO_COUNTRIES,
  MAJOR_TIMEZONES,
  SUPPORTED_LANGUAGES,
} from '@/constants/regions';

import type { AddLeadFormValues } from './form.config';

type LeadDemographicsSectionProps = {
  disabled?: boolean;
};

function createDisplayNames(
  locale: string,
  type: 'region' | 'language'
): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale], { type });
  } catch {
    try {
      return new Intl.DisplayNames(['en'], { type });
    } catch {
      return null;
    }
  }
}

export function LeadDemographicsSection({
  disabled = false,
}: LeadDemographicsSectionProps) {
  const locale = useLocale();
  const t = useTranslations('Leads');
  const tTimezones = useTranslations('Timezones');
  const { control } = useFormContext<AddLeadFormValues>();

  const countryDisplayNames = useMemo(
    () => createDisplayNames(locale, 'region'),
    [locale]
  );
  const languageDisplayNames = useMemo(
    () => createDisplayNames(locale, 'language'),
    [locale]
  );

  const countryOptions = useMemo(
    () =>
      COMMON_ISO_COUNTRIES.map((country) => ({
        value: country.value,
        label: countryDisplayNames?.of(country.value) ?? country.label,
      })),
    [countryDisplayNames]
  );

  const languageOptions = useMemo(
    () =>
      SUPPORTED_LANGUAGES.map((language) => ({
        value: language.value,
        label: languageDisplayNames?.of(language.value) ?? language.label,
      })),
    [languageDisplayNames]
  );

  const timezoneOptions = useMemo(
    () =>
      MAJOR_TIMEZONES.map((timezone) => {
        let label = timezone.label;
        try {
          label = tTimezones(timezone.value as never);
        } catch {
          label = timezone.label;
        }

        return {
          value: timezone.value,
          label,
        };
      }),
    [tTimezones]
  );

  return (
    <>
      <SharedSearchableSelectField
        control={control}
        name="country"
        label={t('form.fields.country.label')}
        placeholder={t('form.fields.country.placeholder')}
        options={countryOptions}
        searchPlaceholder={t('form.searchPlaceholder')}
        emptyLabel={t('form.noResults')}
        disabled={disabled}
      />

      <SharedSearchableSelectField
        control={control}
        name="timezone"
        label={t('form.fields.timezone.label')}
        placeholder={t('form.fields.timezone.placeholder')}
        options={timezoneOptions}
        searchPlaceholder={t('form.searchPlaceholder')}
        emptyLabel={t('form.noResults')}
        disabled={disabled}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SharedSelect
          control={control}
          name="primary_language"
          label={t('form.fields.primary_language.label')}
          placeholder={t('form.fields.primary_language.placeholder')}
          options={languageOptions}
          disabled={disabled}
        />

        <SharedSearchableSelectField
          control={control}
          name="preferred_language"
          label={t('form.fields.preferred_language.label')}
          placeholder={t('form.fields.preferred_language.placeholder')}
          options={languageOptions}
          searchPlaceholder={t('form.searchPlaceholder')}
          emptyLabel={t('form.noResults')}
          disabled={disabled}
          allowNone
          noneLabel={t('form.noneOption')}
        />
      </div>
    </>
  );
}
