import { z } from 'zod';

import type {
  LeadCurrency,
  LeadGender,
  LeadPriority,
  LeadStatus,
} from '@/types/leads';
import { emailSchema, nonNegativeNumberSchema, requiredStringSchema } from '@/lib/validations/common';

export type AddLeadFormValues = {
  first_name: string;
  last_name: string;
  native_name: string;
  email: string;
  phone_country_code: string;
  phone_number: string;
  country: string;
  timezone: string;
  primary_language: string;
  preferred_language: string;
  pipeline_stage_id: string;
  assigned_agent_id: string;
  source_id: string;
  expected_service_date: string;
  next_follow_up_at: string;
  status: LeadStatus;
  priority: LeadPriority;
  gender: LeadGender;
  currency: LeadCurrency;
  estimated_value: number;
};

export const statusOptions: LeadStatus[] = [
  'OPEN',
  'WON',
  'LOST',
  'UNQUALIFIED',
];
export const priorityOptions: LeadPriority[] = ['HOT', 'WARM', 'COLD'];
export const genderOptions: LeadGender[] = [
  'MALE',
  'FEMALE',
  'OTHER',
  'UNKNOWN',
];
export const currencyOptions: LeadCurrency[] = ['USD', 'TRY', 'EUR', 'GBP'];

export const defaultValues: AddLeadFormValues = {
  first_name: '',
  last_name: '',
  native_name: '',
  email: '',
  phone_country_code: '+90',
  phone_number: '',
  country: '',
  timezone: '',
  primary_language: '',
  preferred_language: '',
  pipeline_stage_id: '',
  assigned_agent_id: '',
  source_id: '',
  expected_service_date: '',
  next_follow_up_at: '',
  status: 'OPEN',
  priority: 'WARM',
  gender: 'UNKNOWN',
  currency: 'USD',
  estimated_value: 0,
};

export function createAddLeadSchema(t: (key: string) => string) {
  return z.object({
    first_name: requiredStringSchema(t('validation.firstNameRequired')),
    last_name: requiredStringSchema(t('validation.lastNameRequired')),
    native_name: z.string().trim(),
    email: emailSchema(t),
    phone_country_code: requiredStringSchema(t('validation.phoneCodeRequired')),
    phone_number: requiredStringSchema(t('validation.phoneNumberRequired')),
    country: requiredStringSchema(t('validation.countryRequired')),
    timezone: requiredStringSchema(t('validation.timezoneRequired')),
    primary_language: requiredStringSchema(t('validation.primaryLanguageRequired')),
    preferred_language: z.string().trim(),
    status: z.enum(['OPEN', 'WON', 'LOST', 'UNQUALIFIED']),
    priority: z.enum(['HOT', 'WARM', 'COLD']),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']),
    currency: z.enum(['USD', 'TRY', 'EUR', 'GBP']),
    estimated_value: z
      .number()
      .min(0, t('validation.estimatedValueMin'))
      .finite(t('validation.estimatedValueNumber')),
    pipeline_stage_id: z.string().trim(),
    assigned_agent_id: z.string().trim(),
    source_id: z.string().trim(),
    expected_service_date: z.string().trim(),
    next_follow_up_at: z.string().trim(),
  });
}
