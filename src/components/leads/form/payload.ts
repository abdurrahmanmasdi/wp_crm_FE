import type { CreateLeadPayload } from '@/types/leads';

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
