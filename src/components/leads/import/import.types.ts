import type { LeadPriority, LeadStatus } from '@/types/leads';

export type ImportPhase = 'upload' | 'mapping' | 'processing';

export type ParsedCsvRow = Record<string, string>;

export type ImportMapping = {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
};

export type BatchSettings = {
  status: LeadStatus | '';
  priority: LeadPriority | '';
  source_id: string;
  pipeline_stage_id: string;
  country: string;
  timezone: string;
  primary_language: string;
};

export const MAPPING_FIELD_LABEL_KEYS: Record<keyof ImportMapping, string> = {
  first_name: 'import.mapping.firstName',
  last_name: 'import.mapping.lastName',
  phone_number: 'import.mapping.phone',
  email: 'import.mapping.email',
};

export const NONE_VALUE = '__none__';
