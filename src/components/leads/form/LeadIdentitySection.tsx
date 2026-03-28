'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { PhoneInputGroup } from '@/components/ui/phone-input-group';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COUNTRY_CALLING_CODES } from '@/constants/regions';
import type { LeadGender } from '@/types/leads';

import { type AddLeadFormValues, genderOptions } from './form.config';

type LeadIdentitySectionProps = {
  disabled?: boolean;
};

export function LeadIdentitySection({
  disabled = false,
}: LeadIdentitySectionProps) {
  const t = useTranslations('Leads');
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<AddLeadFormValues>();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="first_name">
            {t('form.fields.first_name.label')}
          </label>
          <Input
            id="first_name"
            placeholder={t('form.fields.first_name.placeholder')}
            disabled={disabled}
            {...register('first_name')}
          />
          {errors.first_name?.message ? (
            <p className="text-destructive text-xs">
              {errors.first_name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="last_name">
            {t('form.fields.last_name.label')}
          </label>
          <Input
            id="last_name"
            placeholder={t('form.fields.last_name.placeholder')}
            disabled={disabled}
            {...register('last_name')}
          />
          {errors.last_name?.message ? (
            <p className="text-destructive text-xs">
              {errors.last_name.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="native_name">
            {t('form.fields.native_name.label')}
          </label>
          <Input
            id="native_name"
            placeholder={t('form.fields.native_name.placeholder')}
            disabled={disabled}
            {...register('native_name')}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            {t('form.fields.email.label')}
          </label>
          <Input
            id="email"
            type="email"
            placeholder={t('form.fields.email.placeholder')}
            disabled={disabled}
            {...register('email')}
          />
          {errors.email?.message ? (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          ) : null}
        </div>
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

      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t('form.fields.gender.label')}
        </label>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => field.onChange(value as LeadGender)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {t(`gender.${gender}` as never)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </>
  );
}
