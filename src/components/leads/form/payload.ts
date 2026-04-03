import { COUNTRY_CALLING_CODES } from '@/constants/regions';
import type { CreateLeadPayload, Lead, UpdateLeadPayload } from '@/types/leads';

import type { AddLeadFormValues } from './form.config';

function toNullable(value: string): string | null {
  return value.trim().length > 0 ? value.trim() : null;
}

function toIsoDate(value: string): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function buildCreateLeadPayload(
  values: AddLeadFormValues
): CreateLeadPayload {
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    phone_number: `${values.phone_country_code}${values.phone_number.replace(/\D/g, '')}`,
    country: values.country,
    timezone: values.timezone,
    primary_language: values.primary_language,
    gender: values.gender,
    status: values.status,
    priority: values.priority,
    estimated_value: values.estimated_value.toString(),
    currency: values.currency,
    native_name: toNullable(values.native_name),
    email: toNullable(values.email),
    preferred_language: toNullable(values.preferred_language),
    pipeline_stage_id: toNullable(values.pipeline_stage_id),
    assigned_agent_id: toNullable(values.assigned_agent_id),
    source_id: toNullable(values.source_id),
    expected_service_date: toIsoDate(values.expected_service_date),
    next_follow_up_at: toIsoDate(values.next_follow_up_at),
  };
}

export function buildUpdateLeadPayload(
  values: AddLeadFormValues
): UpdateLeadPayload {
  return buildCreateLeadPayload(values);
}

function splitPhoneNumber(phoneNumber: string): {
  phone_country_code: string;
  phone_number: string;
} {
  const sortedCallingCodes = [...COUNTRY_CALLING_CODES].sort(
    (a, b) => b.value.length - a.value.length
  );

  const match = sortedCallingCodes.find((code) =>
    phoneNumber.startsWith(code.value)
  );

  if (!match) {
    return {
      phone_country_code: '+90',
      phone_number: phoneNumber,
    };
  }

  return {
    phone_country_code: match.value,
    phone_number: phoneNumber.slice(match.value.length),
  };
}

function toDateInputValue(value: Date | string | null): string {
  if (!value) {
    return '';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

export function buildLeadFormValues(lead: Lead): AddLeadFormValues {
  const phoneParts = splitPhoneNumber(lead.phone_number);

  return {
    first_name: lead.first_name,
    last_name: lead.last_name,
    native_name: lead.native_name ?? '',
    email: lead.email ?? '',
    phone_country_code: phoneParts.phone_country_code,
    phone_number: phoneParts.phone_number,
    country: lead.country,
    timezone: lead.timezone,
    primary_language: lead.primary_language,
    preferred_language: lead.preferred_language ?? '',
    pipeline_stage_id: lead.pipeline_stage_id ?? '',
    assigned_agent_id: lead.assigned_agent_id ?? '',
    source_id: lead.source_id ?? '',
    expected_service_date: toDateInputValue(lead.expected_service_date),
    next_follow_up_at: toDateInputValue(lead.next_follow_up_at),
    status: lead.status,
    priority: lead.priority,
    gender: lead.gender,
    currency: lead.currency,
    estimated_value: Number(lead.estimated_value) || 0,
  };
}
